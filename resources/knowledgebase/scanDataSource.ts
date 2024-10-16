import AWS from "aws-sdk";

const bedrockAgentClient = new AWS.BedrockAgent({ region: "us-east-1" });

// Sync knowledge base
export async function syncKb(kbId: string, dataSourceId: string) {
  try {
    const startJobResponse = await bedrockAgentClient
      .startIngestionJob({
        knowledgeBaseId: kbId,
        dataSourceId
      })
      .promise();

    const job = startJobResponse.ingestionJob;
    let status = job.status;
    const jobId = job.ingestionJobId;

    while (status !== "COMPLETE" && status !== "FAILED") {
      const jobStatus = await bedrockAgentClient
        .getIngestionJob({
          knowledgeBaseId: kbId,
          dataSourceId,
          ingestionJobId: jobId
        })
        .promise();

      status = jobStatus.ingestionJob.status;
    }
 // Validate parameters
 if (!kbId || !dataSourceId) {
  throw new Error("Knowledge Base ID and Data Source ID are required.");
}
const statusValue = status === "COMPLETE" ? "ACTIVE" : "FAILED";
const dataSourceConfig = {
  type: 'S3', // Adjust this based on the type you are working with
  s3Configuration: {
      bucketArn: 'arn:aws:s3:::your-bucket-name', // Replace with your actual bucket ARN
      // Include any other required properties for the S3 configuration
  },
};

    return status;
  } catch (e) {
    console.log(`Error while syncing knowledge base: ${e}`);
    return "FAILED";
  }
}


// export async function addDataSource(kbId: string) {
//   const t = await bedrockAgentClient.createDataSource({
//     knowledgeBaseId: kbId, // Required property
//     name: "dataSourceName", // Required property
//     dataSourceConfiguration: {
//         type: 'WEB', // or the appropriate type based on your use case
//         s3Configuration: {
//             bucketArn: 'arn:aws:s3:::your-bucket-name', // Your actual bucket ARN
//             // Include other necessary properties for S3 configuration, if required
//         },
//     },
//   }).promise();
//   console.log(t);

//   const t2 = await bedrockAgentClient.createDataSource({
//     knowledgeBaseId: kbId, // Required property
//     name: "dataSourceName", // Required property
//     dataSourceConfiguration: {
//       type: 'WEB', // Specify the type as WEB
//       webConfiguration: { // Include webConfiguration
//         sourceConfiguration: {
//           urlConfiguration: {
//             seedUrls: [
//               { url: "https://www.example.com" }, // Replace with your desired URL
//             ],
//           },
//         },
//         crawlerConfiguration: {
//           crawlerLimits: {
//             rateLimit: 300, // Rate limit for the crawler
//           },
//           scope: 'HOST_ONLY', // Scope for crawling
//         },
//       },
//     },
//   }).promise();
// }