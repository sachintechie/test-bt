import { getProjectById } from "../db/adminDbFunctions";

import { addStage_1 } from "../knowledgebase/stageFunctions";
const AWS = require("aws-sdk");
const lambda = new AWS.Lambda();

export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId, bucketName, projectName } = event;
    const project = await getProjectById(projectId);
    const functionName = context.functionName;

    // Call Lambda's GetFunction API to get the function configuration
    const functionData = await lambda.getFunction({ FunctionName: functionName }).promise();

    // Extract the Role ARN from the function's configuration
    const roleArn = functionData.Configuration.Role;

    console.log("Lambda Role ARN:", roleArn);

    // Calls function to handle adding stages and steps for file processing
    const data = await addStage_1(
      project.data?.tenantid ?? "",
      tenantUserId,
      projectId,
      project.data?.s3bucketname ?? "",
      project.data?.chaintype ?? "",
      roleArn
    );
    return {
      status: 200,
      data: "data",
      error: "data"
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return { status: 400, data: null, error: err };
  }
};
