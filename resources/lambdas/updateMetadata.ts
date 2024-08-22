import {getMetadataFromDynamoDB, storeMetadataInDynamoDB} from "../utils/dynamodb";
import AWS from "aws-sdk";

const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId, updates } = event.arguments?.input;

  // Retrieve the current metadata
  const currentMetadata = await getMetadataFromDynamoDB(dynamoDB,contractAddress, tokenId);

  if (!currentMetadata) {
    return {
      status: 404,
      message: 'Metadata not found for the given contractAddress and tokenId'
    };
  }

  // Modify the metadata as needed
  const modifiedMetadata = {
    ...currentMetadata,
    ...updates // Apply the updates to the current metadata
  };

  // Store the updated metadata back in DynamoDB
  await storeMetadataInDynamoDB(dynamoDB,contractAddress, tokenId, modifiedMetadata);

  return {
    status: 200,
    message: 'Metadata updated successfully',
    modifiedMetadata
  };
};
