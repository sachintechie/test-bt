import * as AWS from "aws-sdk";

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB();
const tableName = process.env.DYNAMODB_TABLE_NAME as string;

export const handler = async (event: any, context: any) => {
  try {
    console.log("Parsing input from event...");
    console.log("Event:", event);

    // Extract jobId from the input arguments
    const jobId = event.arguments?.input?.jobId;

    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing jobId in request body",
        }),
      };
    }

    // Define DynamoDB query parameters
    const params = {
      TableName: tableName,
      Key: {
        job_id: { S: jobId },
      },
    };

    // Poll DynamoDB until status is "SUCCESS" or maximum retries are reached
    let queryAnswer = null;
    let status = null;
    let count = 0;
    do {
      const response = await dynamodb.getItem(params).promise();
      queryAnswer = response.Item;
      status = queryAnswer?.status?.S;
      count++;
      console.log(`Polling count: ${count}`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } while (status !== "SUCCESS" && count < 10);

    // Handle case where status is not "SUCCESS"
    if (status !== "SUCCESS") {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Query answer not found or processing timeout",
        }),
      };
    }

    // Extract blockchain_response
    const blockchainResponse = queryAnswer?.blockchain_response?.M;
    if (!blockchainResponse) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "Blockchain response not found",
        }),
      };
    }

    // Return the blockchain response
    return {
      statusCode: 200,
      body: JSON.stringify({
        blockchainResponse: AWS.DynamoDB.Converter.unmarshall(blockchainResponse),
      }),
    };
  } catch (error) {
    console.error("Error during Lambda execution:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};
