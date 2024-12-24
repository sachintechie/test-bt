import axios from "axios";
import { parse } from "node-html-parser";
import { URL } from "url";
import * as AWS from "aws-sdk";
import * as crypto from "crypto";
import { addReferenceToDb } from "../db/adminDbFunctions";
import { RefType } from "../db/models";

const s3 = new AWS.S3();

interface Context {
  // Define the context type if needed
}

export const lambdaHandler = async (event: any, context: Context) => {
  let count = 0;

  try {
    console.log("Lambda handler started");

    const startUrl = event.arguments?.input.url;
    const maxDepth = parseInt(event.arguments?.depth, 10);
    const tenantId = event.identity.resolverContext.id;
    const bucketName = event.arguments?.input.s3bucketname;
    const projectId = event.arguments?.input.projectid;

    if (!startUrl || !bucketName || !projectId) {
      console.error("Missing required arguments in the event.");
      throw new Error("Missing required arguments");
    }

    console.log(`Starting crawl with URL: ${startUrl}, Max Depth: ${maxDepth}`);
    const timeoutPerRequest = 5000;

    // Extract the domain of the source URL
    const sourceDomain = new URL(startUrl).hostname;
    console.log(`Source domain: ${sourceDomain}`);

    // Initialize structures
    const crawled = new Set<string>();
    const toCrawl: [string, number][] = [[startUrl, 0]];
    const textContent: { [key: string]: string } = {};

    console.log("Initialized crawling queue:", toCrawl);

    while (toCrawl.length > 0) {
      const [currentUrl, depth] = toCrawl.pop()!;

      console.log(`Crawling URL: ${currentUrl}, Depth: ${depth}`);

      if (depth > maxDepth || crawled.has(currentUrl)) {
        console.log(`Skipping URL ${currentUrl}: depth exceeded or already crawled.`);
        continue;
      }

      try {
        // Fetch the page
        console.log(`Fetching page: ${currentUrl}`);
        const response = await axios.get(currentUrl, { timeout: timeoutPerRequest });

        // Parse the page
        const parsedHtml = parse(response.data);
        crawled.add(currentUrl);

        // Extract and store text
        const pageText = parsedHtml.text;
        textContent[currentUrl] = pageText.slice(0, 1000); // Limit to 1000 characters
        const textHash = crypto.createHash("sha256").update(textContent[currentUrl]).digest("hex");
        console.log(`Extracted text from ${currentUrl}. Hash value: ${textHash}`);

        // Add reference to DB
        console.log(`Adding reference to DB for URL: ${currentUrl}`);
        await addReferenceToDb(tenantId, RefType.DOCUMENT, true, projectId, 200, true, currentUrl, textHash);

        // Store the content in S3
        console.log(`Uploading content of ${currentUrl} to S3 bucket: ${bucketName}`);
        await s3
          .putObject({
            Bucket: bucketName,
            Key: currentUrl + ".txt",
            Body: textContent[currentUrl]
          })
          .promise();

        count++;
        console.log(`Uploaded content and updated count to ${count}`);

        // get all the hrefs from the page
        // Gather all hrefs first, mapping to resolved URLs
        const hrefs = parsedHtml
          .querySelectorAll("a[href]")
          .map((element) => {
            const href = element.getAttribute("href");
            if (!href) {
              return null; // Return null for invalid hrefs
            }
            return new URL(href, currentUrl).toString(); // Resolve relative URLs
          })
          .filter((href) => href !== null); // Filter out any null values

        // Process the hrefs
        while (depth < maxDepth && hrefs.length > 0) {
          const href = hrefs.pop()!; // Get the next href from the array

          try {
            const parsedUrl = new URL(href);

            // Check if the URL belongs to the same domain as the source URL
            if (parsedUrl.hostname === sourceDomain && !crawled.has(href)) {
              const newDepth = depth + 1;

              // Only add to the crawl queue if the new depth is within the limit
              if (newDepth <= maxDepth) {
                console.log(`Adding link to crawl: ${href} at depth ${newDepth}`);
                toCrawl.push([href, newDepth]);
              } else {
                // Log the skipped link due to depth limit
                console.log(`Skipping link (depth exceeded): ${href}`);
              }
            }
          } catch (e) {
            console.error(`Error processing tag: ${e}`);
          }
        }

        // Delay to avoid rate-limiting
        console.log("Delaying to avoid rate-limiting...");
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching ${currentUrl}: ${error.message}`);
        continue;
      }
    }

    console.log(`Crawl complete. Total pages crawled: ${count}`);
    return {
      statusCode: 200,
      body: `Pages crawled: ${count}`
    };
  } catch (error) {
    console.error("Error in lambdaHandler:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }, null, 2)
    };
  }
};
