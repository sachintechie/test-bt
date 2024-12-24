import * as AWS from "aws-sdk";
import web3 from "web3";
import { CHAIN_TO_CHAIN_NAME_MAPPING } from "../utils/utils";
import { getHashTransactionDetails } from "../avalanche/commonFunctions";

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB();
const tableName = process.env.DYNAMODB_TABLE_NAME as string;

export const handler = async (event: any, context: any) => {
  try {
    console.log("Parsing input from event...");
    console.log("Event:", JSON.stringify(event));

    // Extract jobId from the input arguments
    const jobId = event.arguments?.input?.jobId;

    if (!jobId) {
      return {
        status: 400,
        error: "Missing jobId in request body",
        data: null
      };
    }

    // Define DynamoDB query parameters
    const params = {
      TableName: tableName,
      Key: {
        job_id: { S: jobId }
      }
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
        status: 500,
        error: "Query answer not found or processing timeout",
        data: null
      };
    }

    // Extract blockchain_response
    const blockchainResponse = queryAnswer?.blockchain_response?.M;
    if (!blockchainResponse) {
      return {
        status: 404,
        error: "Blockchain response not found",
        data: null
      };
    }

    let unmarshalledResponse = AWS.DynamoDB.Converter.unmarshall(blockchainResponse, { convertEmptyValues: true });
    let error = unmarshalledResponse.error;
    if (error) {
      return {
        status: 500,
        error: error,
        data: null
      };
    }
    console.log("Unmarshalled response:", unmarshalledResponse.data);
    // Extract the blockchain response data
    if (unmarshalledResponse.data.chainType == CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE) {
      // get the latest transaction details
      const latestTransactionDetails = await getHashTransactionDetails(unmarshalledResponse.data.txHash);
      console.log("Latest transaction details:", latestTransactionDetails);
      // update the unmarshalledResponse with the latest transaction details
      unmarshalledResponse.confirmations = latestTransactionDetails.data?.confirmations;
    }
    // Return the blockchain response
    return {
      status: 200,
      error: null,
      // give JSON object as data
      data: unmarshalledResponse.data
    };
  } catch (error) {
    console.error("Error during Lambda execution:", error);
    return {
      status: 500,
      error: "Internal server error",
      data: null
    };
  }
};
