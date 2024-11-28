import * as AWS from 'aws-sdk';
import { storeHash as avalancheStoreHash } from "../avalanche/storeHashFunctions";
import { storeHash as provenanceStoreHash } from "../provenance/storeHashFunctions";

// Create an enum for the chain types
enum ChainType {
  Avalanche = "Avalanche",
  Provenance = "Provenance"
}

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Add attribute to item in DynamoDB
async function addAttributeToItem(
  tableName: string,
  key: AWS.DynamoDB.DocumentClient.Key,
  newAttributes: { [key: string]: any }
) {
  const updateExpression = Object.keys(newAttributes)
    .map((key, idx) => `#${key} = :val${idx}`)
    .join(", ");

  const expressionAttributeNames = Object.keys(newAttributes).reduce(
    (acc, key) => {
      acc[`#${key}`] = key;
      return acc;
    },
    {} as { [key: string]: string }
  );

  const expressionAttributeValues = Object.keys(newAttributes).reduce(
    (acc, key, idx) => {
      acc[`:val${idx}`] = newAttributes[key];
      return acc;
    },
    {} as { [key: string]: any }
  );

  try {
    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: `SET ${updateExpression}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "UPDATED_NEW"
    };
    const response = await dynamodb.update(params).promise();
    console.log("DynamoDB UpdateItem succeeded:", response);
  } catch (error) {
    console.error("Error updating item in DynamoDB:", error);
  }
}

// Lambda Handler
export const handler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Extract values from the event
    const { chainType, hash, uuid, isSecondTx } = event || {};
    const tableName = 'aws-abu-dhabi-dynamodb'; // DynamoDB table name
    console.log(`Processing chainType: ${chainType}, hash: ${hash}, uuid: ${uuid}, isSecondTx: ${isSecondTx}`);

    let hashResult;
    let blockchainTransactionId: string | undefined;

    // Check the chainType and call the appropriate storeHash function
    switch (chainType) {
      case ChainType.Avalanche:
        console.log("Calling Avalanche storeHash function...");
        hashResult = await avalancheStoreHash(hash, isSecondTx);
        blockchainTransactionId = hashResult?.data?.txHash; // Assuming data contains transactionId
        console.log("Avalanche storeHash result:", JSON.stringify(hashResult, null, 2));
        break;

      case ChainType.Provenance:
        console.log("Calling Provenance storeHash function...");
        const provenanceAddress = "0xa0f70a94393b30f8b06382aabe21f16e9bc11b0e6929586dcefb7e83fa6d4d2e";
        const mnemonic = process.env.PROVANENCE_MNEMONIC || "";
        hashResult = await provenanceStoreHash(provenanceAddress, hash, mnemonic);
        blockchainTransactionId = hashResult?.data?.txHash; // Assuming data contains transactionId
        console.log("Provenance storeHash result:", JSON.stringify(hashResult, null, 2));
        break;

      default:
        console.error("ChainType not supported:", chainType);
        return {
          status: 400,
          data: null,
          error: "ChainType not supported"
        };
    }

    // If hashResult has data, we proceed with the DynamoDB update
    if (hashResult?.data) {
      console.log("Hash result contains data. Proceeding with DynamoDB update...");

      const jobId = uuid; // Assuming uuid is the job_id in your DynamoDB table
      const primaryKey = { job_id: jobId };

      const newAttributes = {
        hash_value: hash,
        blockchain_response: hashResult, // Store the response from the storeHash function
        blockchain_transactionId: blockchainTransactionId,
        '#st': 'SUCCESS'
      };

      console.log("Updating DynamoDB with new attributes:", JSON.stringify(newAttributes, null, 2));

      // Update the DynamoDB item with the new attributes
      await addAttributeToItem(tableName, primaryKey, newAttributes);

      console.log("DynamoDB update successful.");
      return {
        status: 200,
        data: hashResult.data,
        error: null
      };
    } else {
      console.error("Hash result does not contain data:", hashResult?.error || "No data returned");
      return {
        status: 400,
        data: null,
        error: hashResult?.error || "Error storing the hash"
      };
    }
  } catch (err) {
    console.error("Error in handler:", err);
    return {
      status: 400,
      data: null,
      error: err || "An error occurred"
    };
  }
};
