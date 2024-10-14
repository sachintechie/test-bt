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
        actions: ["rds:*", "rds-data:*", "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "dynamodb:*"],
        resources: ["*"] // Allow access to all RDS instances and Secrets Manager secrets
      })
    );

    // Grant Lambda role necessary permissions for VPC and CloudWatch logs
    lambdaRoleSingleton.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaVPCAccessExecutionRole"));
    lambdaRoleSingleton.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
  }
  const apiGatewayInvokePolicy = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: ['lambda:InvokeFunction'],
    principals: [new iam.ServicePrincipal('apigateway.amazonaws.com')],
    resources: ['*'], // Allows all API Gateway resources to invoke the Lambda
  });
  lambdaRoleSingleton.addToPolicy(apiGatewayInvokePolicy);
  return lambdaRoleSingleton;
};
