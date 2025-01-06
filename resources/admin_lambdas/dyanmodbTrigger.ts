import * as AWS from "aws-sdk";
import { storeHash as avalancheStoreHash } from "../avalanche/storeHashFunctions";
import { storeHash as provenanceStoreHash } from "../provenance/storeHashFunctions";
import { getProjectById } from "../db/adminDbFunctions";
import { CHAIN_TO_CHAIN_NAME_MAPPING } from "../utils/utils";
import * as crypto from "crypto";

// Initialize DynamoDB client
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Add attribute to item in DynamoDB
async function addAttributeToItem(tableName: string, key: AWS.DynamoDB.DocumentClient.Key, newAttributes: { [key: string]: any }) {
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

// Helper function to extract project_id from source_filenamelist
function getProjectIdFromSourceFileList(sourceFileList: any[]): string | null {
  for (const file of sourceFileList) {
    if (file.S) {
      try {
        const parsed = JSON.parse(file.S);
        if (parsed.project_id) {
          return parsed.project_id;
        }
      } catch (e) {
        console.error("Error parsing source_filenamelist item:", e);
      }
    }
  }
  return null;
}

// Lambda Handler
export const handler = async (event: any) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // derive table name from event source ARN
    const tableName = event.Records[0].eventSourceARN.split("/")[1];
    console.log("Table name:", tableName);

    // Process each record in the event
    for (const record of event.Records) {
      if (record.eventName === "INSERT" && !record.dynamodb.NewImage?.hash_value) {
        const item = record.dynamodb.NewImage;

        // Extract job_id from the item
        const jobId = item?.job_id?.S;
        if (!jobId) {
          console.error("Job ID missing in record.");
          continue; // Skip this record if job_id is missing
        }

        const primaryKey = { job_id: jobId };
        const itemJson = JSON.stringify(item, Object.keys(item).sort());

        // Generate hash value
        const hashValue = crypto.createHash("sha256").update(itemJson).digest("hex");
        console.log("Generated hash value:", hashValue);

        // Extract source_filenamelist to get project_id
        const sourceFileList = item?.source_filenamelist?.L || [];
        // const extractedProjectId = getProjectIdFromSourceFileList(sourceFileList);
         const finalProjectId = item?.project_id?.S;

        let project;
        if (finalProjectId) {
          project = await getProjectById(finalProjectId);

          if (!project || !project.data) {
            console.error("Project not found:", finalProjectId);
            continue; // Skip this record if project is not found
          }
        }

        // Default to Avalanche if no project is found or projectId is missing
        const chainType = project?.data?.chaintype || CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE;
        console.log(`Processing chainType: ${chainType} for job_id: ${jobId}`);

        let hashResult;
        let blockchainTransactionId: string | undefined;

        // Call the appropriate storeHash function based on chainType
        switch (chainType) {
          case CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE:
            console.log("Calling Avalanche storeHash function...");
            hashResult = await avalancheStoreHash(hashValue, false); // Pass hashValue and isSecondTx flag
            blockchainTransactionId = hashResult?.data?.txHash; // Assuming data contains transactionId
            console.log("Avalanche storeHash result:", JSON.stringify(hashResult, null, 2));
            break;

          case CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE:
            console.log("Calling Provenance storeHash function...");
            const provenanceAddress = "0xa0f70a94393b30f8b06382aabe21f16e9bc11b0e6929586dcefb7e83fa6d4d2e";
            const mnemonic = process.env.PROVANENCE_MNEMONIC || "";
            hashResult = await provenanceStoreHash(provenanceAddress, hashValue, mnemonic);
            blockchainTransactionId = hashResult?.data?.txHash; // Assuming data contains transactionId
            console.log("Provenance storeHash result:", JSON.stringify(hashResult, null, 2));
            break;

          default:
            console.error("ChainType not supported:", chainType);
            continue; // Skip this record if chainType is unsupported
        }

        // If hashResult contains data, proceed with the DynamoDB update
        if (hashResult?.data) {
          console.log("Hash result contains data. Proceeding with DynamoDB update...");

          const newAttributes = {
            hash_value: hashValue,
            blockchain_response: hashResult, // Store the response from the storeHash function
            blockchain_transactionId: blockchainTransactionId,
            status: "SUCCESS"
          };

          console.log("Updating DynamoDB with new attributes:", JSON.stringify(newAttributes, null, 2));

          // Update the DynamoDB item with the new attributes
          await addAttributeToItem(tableName, primaryKey, newAttributes);

          console.log("DynamoDB update successful.");
        } else {
          console.error("Hash result does not contain data:", hashResult?.error || "No data returned");
        }
      }
    }

    return {
      status: 200,
      data: "Processing complete",
      error: null
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return {
      status: 400,
      data: null,
      error: err || "An error occurred"
    };
  }
};
