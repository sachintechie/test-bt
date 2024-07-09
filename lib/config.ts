import * as cdk from "aws-cdk-lib";
import {SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import * as path from "path";


const app = new cdk.App();
const environment = app.node.tryGetContext('env');

export const newNodeJsFunction = (scope: Construct, id: string, resourcePath: string, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: getEnvConfig(),
    vpc: Vpc.fromVpcAttributes(scope, env`vpc`, getVpcConfig()),
    securityGroups: getSecurityGroups(scope)
  });
}

export const getEnvConfig = () => {
  switch (environment) {
    case "dev":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
      };
    case "staging":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
      };
    case "prod":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
      };
    default:
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
      };
  }
}

export const getVpcConfig = () => {
  switch (environment) {
    case "dev":
      return {
        vpcId: "vpc-02d0d267eb1e078f8",
        availabilityZones: cdk.Fn.getAzs(),
        privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
      };
    case "staging":
      return {
        vpcId: "vpc-02d0d267eb1e078f8",
        availabilityZones: cdk.Fn.getAzs(),
        privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
      };
    case "prod":
      return {
        vpcId: "vpc-02d0d267eb1e078f8",
        availabilityZones: cdk.Fn.getAzs(),
        privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
      };
    default:
      return {
        vpcId: "vpc-02d0d267eb1e078f8",
        availabilityZones: cdk.Fn.getAzs(),
        privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
      };
  }
}

export const getSecurityGroups = (scope:Construct) => {
  switch (environment) {
    case "dev":
      return [
        SecurityGroup.fromSecurityGroupId(scope, "lambda-rds-6", "sg-0f6682da4f545d758"),
        SecurityGroup.fromSecurityGroupId(scope, "default", "sg-05c044e1e87960084")
      ];
    case "staging":
      return [
        SecurityGroup.fromSecurityGroupId(scope, "lambda-rds-6", "sg-0f6682da4f545d758"),
        SecurityGroup.fromSecurityGroupId(scope, "default", "sg-05c044e1e87960084")
      ];
    case "prod":
      return [
        SecurityGroup.fromSecurityGroupId(scope, "lambda-rds-6", "sg-0f6682da4f545d758"),
        SecurityGroup.fromSecurityGroupId(scope, "default", "sg-05c044e1e87960084")
      ];
    default:
      return [
        SecurityGroup.fromSecurityGroupId(scope, "lambda-rds-6", "sg-0f6682da4f545d758"),
        SecurityGroup.fromSecurityGroupId(scope, "default", "sg-05c044e1e87960084")
      ];
  }
}

export function env(strings: TemplateStringsArray, ...values: any[]): string {
  // Concatenate the strings and values
  let result = '';
  strings.forEach((str, i) => {
    result += str + (values[i] || '');
  });

  // Append the environment name
  return result + '-' + environment;
}