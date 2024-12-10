import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { env } from "./env";

let lambdaRoleSingleton: iam.Role;
export const getLambdaRole = (scope: Construct) => {
  if (!lambdaRoleSingleton) {
    // Create an IAM role for the Lambda function
    lambdaRoleSingleton = new iam.Role(scope, env`LambdaRole`, {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
    });

    // Grant Lambda role access to all RDS instances and Secrets Manager secrets
    lambdaRoleSingleton.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          "rds:*",
          "rds-data:*",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "dynamodb:*",
          "bedrock:*",
          "lambda:InvokeFunction",
          "lambda:GetFunction",
          "s3:GetObject",
          "s3:PutObject"
        ],
        resources: ["arn:aws:lambda:us-east-1:084828599845:function:*","*"] // Allow access to all RDS instances and Secrets Manager secrets
      })
    );

    // Grant Lambda role necessary permissions for VPC and CloudWatch logs
    lambdaRoleSingleton.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"));
    lambdaRoleSingleton.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
  
  
    // Grant Lambda role permissions for AOSS and Elasticsearch (ES)
    lambdaRoleSingleton.addToPolicy(
      new iam.PolicyStatement({
        actions: ["aoss:*"],
        resources: ["*"], // Allow access to all AOSS resources
      })
    );

    lambdaRoleSingleton.addToPolicy(
      new iam.PolicyStatement({
        actions: ["es:*"],
        resources: ["*"], // Allow access to all Elasticsearch resources
      })
    );
  }
  
  return lambdaRoleSingleton;
};
