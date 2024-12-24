import axios from "axios";
import { parse } from "node-html-parser";
import { URL } from "url";
import * as AWS from "aws-sdk";
import * as crypto from "crypto";
import { addReferenceToDb, addWebsiteReferenceToDb } from "../db/adminDbFunctions";
import { RefType } from "../db/models";
import { ReferenceStatus } from "@prisma/client";
import { formatBytes } from "../knowledgebase/commonFunctions";

const s3 = new AWS.S3();



export const handler = async (event: any) => {
  let count = 0;

  try {
    console.log("Lambda handler started");


    const { projectId, tenantId, bucketName,tenantUserId, maxDepth,webUrl,refId,isAddedByAdmin } = event;
    const startUrl = webUrl;


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

        // Store the content in S3
        console.log(`Uploading content of ${currentUrl} to S3 bucket: ${bucketName}`);
        const fileName = currentUrl + ".txt";
        await s3
          .putObject({
            Bucket: bucketName,
            Key: fileName,
            Body: textContent[currentUrl]
          })
          .promise();
        // Prepare the S3 get parameters
        const s3Params = {
          Bucket: bucketName,
          Key: fileName
        };

        const s3Details = await s3.getObject(s3Params).promise();
        console.log("s3Details", s3Details);
        let size = await formatBytes(s3Details.ContentLength || 0);

        // Add reference to DB
        console.log(`Adding reference to DB for URL: ${currentUrl}`);
        const file = {
          fileName: fileName,
          fileSize: size,
          refType: RefType.DOCUMENT,
          contentType: ""
        };
       const addedRef =  await addWebsiteReferenceToDb(tenantId, file, false, projectId, ReferenceStatus.PENDING, isAddedByAdmin, tenantUserId,refId);
       console.log("addedRef",addedRef);
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
      } catch (error :  any) {
        console.error(`Error fetching ${currentUrl}: ${error}`);
        continue;
      }
    }

    console.log(`Crawl complete. Total pages crawled: ${count}`);
    return {
      statusCode: 200,
      body: `Pages crawled: ${count}`
    };
  } catch (error) {
    console.error("Error in lambdaHandler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error }, null, 2)
    };
  }
};
