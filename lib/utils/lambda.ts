import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { getVpcConfig } from "./vpc";
import { env, getDescription, getEnvConfig } from "./env";
import { getLambdaRole } from "./iam";
import { getSecurityGroups } from "./security_group";
import { DatabaseInfo } from "./aurora";
import * as iam from "aws-cdk-lib/aws-iam";

// Function to create a new Node.js Lambda function with the Prisma layer for reducing deployment size
export const newNodeJsFunction = (
  scope: Construct,
  id: string,
  resourcePath: string,
  dataInfo: DatabaseInfo,
  memorySize: number = 512
) => {
  // Add Prisma to a Lambda layer to avoid bundling Prisma in each Lambda function
  const prismaLayer = new lambda.LayerVersion(scope, `${id}-PrismaLayer`, {
    code: lambda.Code.fromAsset(path.join(__dirname, "../layers/prisma")), // Assumed path to pre-built Prisma layer
    compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    description: "Prisma ORM Layer for Lambda functions",
  }); 

  // Return the new Nodejs Lambda function
  const lambdaFunction= new NodejsFunction(scope, env`${id}`, {
    functionName: env`${id}-function`,
    description: getDescription(),
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize,
    environment: {
      ...getEnvConfig(dataInfo),
    },
    vpc: getVpcConfig(scope),
    securityGroups: getSecurityGroups(scope),
    role: getLambdaRole(scope),
    layers: [prismaLayer], // Attach the Prisma layer here
    bundling: {
      minify: true, // Ensure code is minified
      nodeModules: [],
      commandHooks: {
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return []; // No additional commands before bundling
        },
        beforeInstall(inputDir: string, outputDir: string): string[] {
          return [`cp -R ${inputDir}/prisma ${outputDir}/`]; // Copy Prisma schema before installation
        },
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [
            `npx prisma generate --schema=${outputDir}/prisma/schema.prisma`, // Generate Prisma client
            `cp ${inputDir}/package.json ${outputDir}/node_modules/`, // Copy package.json
            `cp ${inputDir}/package-lock.json ${outputDir}/node_modules/`, // Copy package-lock.json
          ];
        },
      },
    },
  });
  return lambdaFunction;
};

export const newMigrateNodeJsFunction = (scope: Construct, id: string, resourcePath: string, dataInfo: DatabaseInfo, memorySize: number = 512) => {
  return new NodejsFunction(scope, env`${id}`, {
    functionName: env`${id}-function`,
    description: getDescription(),
    runtime: lambda.Runtime.NODEJS_18_X,
    entry: path.join(__dirname, resourcePath),
    timeout: cdk.Duration.minutes(15),
    memorySize: memorySize,
    environment: { ...getEnvConfig(dataInfo) },
    vpc: getVpcConfig(scope),
    securityGroups: getSecurityGroups(scope),
    role: getLambdaRole(scope),
    bundling: {
      nodeModules: ["@prisma/client", "prisma"],
      minify: true,
      commandHooks: {
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [];
        },
        beforeInstall(inputDir: string, outputDir: string): string[] {
          return [`cp -R ${inputDir}/prisma ${outputDir}/`];
        },
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [
            `npx prisma generate --schema=${outputDir}/prisma/schema.prisma`,
            `cp ${inputDir}/package.json ${outputDir}/node_modules/`,
            `cp ${inputDir}/package-lock.json ${outputDir}/node_modules/`,
            `cp -R ${outputDir}/node_modules/prisma/build/* ${outputDir}/node_modules/.bin/`
          ];
        }
      }
    }
  });
};