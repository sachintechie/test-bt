import { getRefWithSteps } from "../db/adminDbFunctions";
import { tenant } from "../db/models";
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
export const handler = async (event: any,context:any) => {
  try {
    console.log(event);
    
      // Get Lambda function metadata using AWS SDK
      const functionName = context.functionName;
    
      // Call Lambda's GetFunction API to get the function configuration
      const functionData = await lambda.getFunction({ FunctionName: functionName }).promise();
  
      // Extract the Role ARN from the function's configuration
      const roleArn = functionData.Configuration.Role;
  
      console.log('Lambda Role ARN:', roleArn);

    const data = await getStepsByRefId(
    //  event.identity.resolverContext as tenant,
      event.arguments?.input?.refId
    );
    const projectData = {
      status: data.project != null ? 200 : 400,
      data: data.project,
      error: data.project == null ? data.error : null
    };

    console.log("project", projectData);

    return projectData;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function getStepsByRefId( refId: string) {
  console.log("refId", refId);

  try {
    const ref = await getRefWithSteps(refId);
    if (ref.error) {
      return {
        project: null,
        error: ref.error
      };
    } else {
      return {
        project: ref.data,
        error: null
      };
    }
  } catch (err) {
    console.log(err);
    return {
      project: null,
      error: err
    };
  }
}

