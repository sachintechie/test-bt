import {Construct} from "constructs";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import {getVpcConfig} from "./vpc";
import {env, getDescription, getEnvConfig} from "./env";
import {getLambdaRole} from "./iam";
import {getSecurityGroups} from "./security_group";

export const newNodeJsFunction = (scope: Construct, id: string, resourcePath: string, dbUrl:string, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    functionName: env`${id}-lambda`,
    description:getDescription(),
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: {...getEnvConfig(), DATABASE_URL: dbUrl},
    vpc: getVpcConfig(scope),
    securityGroups: getSecurityGroups(scope),
    role: getLambdaRole(scope)
  });
}

export const newMigrationFunction = (scope: Construct, id: string, resourcePath: string, dbUrl:string, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    functionName: env`${id}-lambda`,
    description:getDescription(),
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: {...getEnvConfig(), DATABASE_URL: dbUrl},
    vpc: getVpcConfig(scope),
    securityGroups: getSecurityGroups(scope),
    role: getLambdaRole(scope),
    bundling: {
      nodeModules: ['prisma', '@prisma/client'],
      commandHooks: {
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [];
        },
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [
            `cp ${inputDir}/schema.prisma`,
            `npx prisma generate --schema=${outputDir}/schema.prisma`,
          ];
        },
        beforeInstall() {
          return [];
        },
      },
    },
  });
}