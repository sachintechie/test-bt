import AWS from "aws-sdk";

export async function storeMetadataInDynamoDB(dynamoDB: AWS.DynamoDB.DocumentClient,contractAddress: string, tokenId: number, metadata: any) {
  const params = {
    TableName: process.env.METADATA_TABLE!,
    Item: {
      'ContractAddressTokenId': `${contractAddress}_${tokenId}`, // Composite key
      'ContractAddress': contractAddress,
      'TokenId': tokenId,
      ...metadata  // Spread metadata fields into the DynamoDB item
    }
  };

  try {
    await dynamoDB.put(params).promise();
  } catch (error) {
    console.error(`Error storing metadata for tokenId ${tokenId}:`, error);
    throw error;
  }
}

export async function getMetadataFromDynamoDB(dynamoDB: AWS.DynamoDB.DocumentClient,contractAddress: string, tokenId: number): Promise<any | null> {
  const params = {
    TableName: process.env.METADATA_TABLE!,
    Key: {
      'ContractAddressTokenId': `${contractAddress}_${tokenId}`
    }
  };

  try {
    const result = await dynamoDB.get(params).promise();
    return result.Item as any | null;
  } catch (error) {
    console.error(`Error retrieving metadata for ${contractAddress}_${tokenId}:`, error);
    throw error;
  }
}