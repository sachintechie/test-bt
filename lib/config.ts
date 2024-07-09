import * as cdk from "aws-cdk-lib";
import {ISecurityGroup, IVpc, SecurityGroup, Vpc} from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Construct} from "constructs";
import * as path from "path";
import {Environment} from "aws-cdk-lib";


const app = new cdk.App();
const environment = app.node.tryGetContext('env');

export const newNodeJsFunction = (scope: Construct, id: string, resourcePath: string, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: getEnvConfig(),
    vpc: getVpcConfig(scope),
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

let vpcSingleton:IVpc

export const getVpcConfig = (scope:Construct) => {
  switch (environment) {
    case "dev":
      if(!vpcSingleton){
        vpcSingleton= Vpc.fromVpcAttributes(scope, env`vpc`,{
          vpcId: "vpc-02d0d267eb1e078f8",
          availabilityZones: cdk.Fn.getAzs(),
          privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
        });
      }
      return vpcSingleton;
    case "staging":
      if(!vpcSingleton){
        vpcSingleton= Vpc.fromVpcAttributes(scope, env`vpc`,{
          vpcId: "vpc-02d0d267eb1e078f8",
          availabilityZones: cdk.Fn.getAzs(),
          privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
        });
      }
      return vpcSingleton;
    case "prod":
      if(!vpcSingleton){
        vpcSingleton= Vpc.fromVpcAttributes(scope, env`vpc`,{
          vpcId: "vpc-02d0d267eb1e078f8",
          availabilityZones: cdk.Fn.getAzs(),
          privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
        });
      }
      return vpcSingleton;
    default:
      if(!vpcSingleton){
        vpcSingleton= Vpc.fromVpcAttributes(scope, env`vpc`,{
          vpcId: "vpc-02d0d267eb1e078f8",
          availabilityZones: cdk.Fn.getAzs(),
          privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
        });
      }
      return vpcSingleton;
  }
}

let securityGroupsSingleton:ISecurityGroup[]

export const getSecurityGroups = (scope:Construct) => {
  switch (environment) {
    case "dev":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    case "staging":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    case "prod":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    default:
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
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

export const envConfig: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

