import {getMetadataFromDynamoDB} from "../utils/dynamodb";
import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId, walletAddress } = event;
  console.log("Retrieving metadata for contractAddress:", contractAddress, "and tokenId:", tokenId);
  console.log("Retrieving metadata for walletAddress:", walletAddress);

  // Retrieve the current metadata
  const metadata = await getMetadataFromDynamoDB(dynamoDB, contractAddress, tokenId);


  return {
    status: 200,
    message: "retrieved successfully",
    asset: metadata
  };
};
