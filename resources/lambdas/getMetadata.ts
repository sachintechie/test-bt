import {getMetadataFromDynamoDB} from "../utils/dynamodb";
import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId } = event;
  console.log('Retrieving metadata for contractAddress:', contractAddress, 'and tokenId:', tokenId)
  // Retrieve the current metadata
  const metadata = await getMetadataFromDynamoDB(dynamoDB,contractAddress, tokenId);

  if (!metadata) {
    return {
      status: 404,
      message: 'Metadata not found for the given contractAddress and tokenId'
    };
  }

  return {
    status: 200,
    message: 'Metadata retrieved successfully',
    metadata
  };
};
