import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import {getVpcConfig} from "./vpc";
import {env, getEnvConfig} from "./env";
import {getLambdaRole} from "./iam";
import {getSecurityGroups} from "./security_group";

export const newNodeJsFunction = (scope: Construct, id: string, resourcePath: string, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: getEnvConfig(),
    vpc: getVpcConfig(scope),
    securityGroups: getSecurityGroups(scope),
    role: getLambdaRole(scope)
  });
}