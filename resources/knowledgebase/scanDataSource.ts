import AWS from "aws-sdk";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { op } from "@cubist-labs/cubesigner-sdk/dist/src/fetch";

// Create a Lambda client
const lambdaClient = new LambdaClient({ region: "us-east-1" });
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

    return {status,ingestionJobId : jobId};
  } catch (e) {
    console.log(`Error while syncing knowledge base: ${e}`);
    return {status :"FAILED" };
  }
}

export async function getKbStatus(kbId: string, dataSourceId: string) {

  const dataSource = await bedrockAgentClient
  .getDataSource({
    knowledgeBaseId: kbId,
    dataSourceId
    //ingestionJobId: jobId
  })
  .promise();

const status = dataSource.dataSource.status;
console.log("Data Source Status",status);
return status;

}




export async function addWebsiteDataSource(operation : string,kbId: string,url: string,websiteName? : string, action? : string, dataSourceId? : string) {
  console.log("Adding website data source to Bedrock",operation,kbId,url,action,dataSourceId);
  const params = {
    FunctionName: "addDataSourceToBedrock", // Name of the target Lambda function
    Payload: Buffer.from(JSON.stringify({
      kb_id: kbId, // Pass any data you need to the target Lambda
      operation: operation,
      url:url,
      ds_name:"website" + websiteName,
      action: action,
      datasource_id: dataSourceId
    })),
  };

  // Create the command to invoke the Lambda
  const command = new InvokeCommand(params);

  // Send the command to invoke the Lambda function
  const response = await lambdaClient.send(command);

  // Process the response from the invoked Lambda (if needed)
  const payload = JSON.parse(new TextDecoder("utf-8").decode(response.Payload));
  
  console.log("Response from invoked Lambda:", payload);
  return payload;
}