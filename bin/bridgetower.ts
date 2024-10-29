#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";

import { env, envConfig, isDevOrProd, isOnDemandProd, isPlaygroundDev } from "../lib/utils/env";
import { BridgeTowerAppSyncStack } from "../lib/bridgetower-appsync-stack";
import { AuroraStack } from "../lib/bridgetower-aurora-stack";
import { getDatabaseInfo, getDevOrProdDatabaseInfo } from "../lib/utils/aurora";

const app = new cdk.App();

let auroraStack: AuroraStack | undefined;

if (!isDevOrProd() && !isOnDemandProd() && !isPlaygroundDev()) {
  // Import the Aurora stack
  auroraStack = new AuroraStack(app, env`BTAuroraStack`, {
    env: envConfig
  });
}

const sharedLayer = new lambda.LayerVersion(app, 'SharedUtilsLayer', {
  code: lambda.Code.fromAsset('resources/shared_lambdas'), // path to shared functions
  compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
  description: 'Layer with shared functions like getCategories',
});


// Create the stack with an environment-specific ID
new BridgeTowerAppSyncStack(app, env`BTAppSyncStack`, {
  env: envConfig,
  lambdaFolder: "../../resources/lambdas",
  schemaFile: "schema.graphql",
  name: "GraphQLAPI",
  authorizerLambda: "appsyncAuthorizer",
  hasApiGateway: true,
  apiName: "Api",
  needMigrate: false, //check mudassir
  auroraStack: auroraStack,
  layers: [sharedLayer],
});

new BridgeTowerAppSyncStack(app, env`BTAppSyncStackAdmin`, {
  env: envConfig,
  lambdaFolder: "../../resources/admin_lambdas",
  schemaFile: "admin_schema.graphql",
  name: "AdminGraphQLAPI",
  authorizerLambda: "adminAppsyncAuthorizer",
  hasApiGateway: false,
  apiName: "AdminApi",
  needMigrate: false,
  auroraStack: auroraStack,
  layers: [sharedLayer],
});
