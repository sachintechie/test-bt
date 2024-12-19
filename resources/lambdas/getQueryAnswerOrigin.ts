import * as AWS from "aws-sdk";

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB();
const tableName = process.env.DYNAMODB_TABLE_NAME as string;

export const handler = async (event: any, context: any) => {
  try {
    // Parse the input from the event
    console.log("Parsing input from event...");

    console.log("Event:", event);

    const jobId = event.arguments?.input?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing jobId in request body"
        })
      };
    }

    // Fetch the query answer from DynamoDB
    const params = {
      TableName: tableName,
      Key: {
        job_id: { S: jobId }
      }
    };

    // while status ( one of the field in table is not equal to "SUCCESS") keep polling
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

    if (status !== "SUCCESS") {
      return {
        statusCode: 500,
        body: JSON.stringify({
          message: "Query answer not found"
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        queryAnswer
      })
    };
  } catch (error) {
    console.error("Error during Lambda execution:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error"
      })
    };
  }
};
