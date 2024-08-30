#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import {env, envConfig} from "../lib/utils/env";
import {BridgeTowerAppSyncStack} from "../lib/bridgetower-appsync-stack";


const app = new cdk.App();

// Create the stack with an environment-specific ID
new BridgeTowerAppSyncStack(app, env`BTAppSyncStack`, {
  env: envConfig,
  lambdaFolder: '../../resources/lambdas',
  schemaFile: 'schema.graphql',
  name:'GraphQLAPI',
  authorizerLambda:'appsyncAuthorizer',
  hasApiGateway:true,
  apiName:'Api',
  needMigrate:true
});

new BridgeTowerAppSyncStack(app, env`BTAppSyncStackAdmin`, {
  env: envConfig,
  lambdaFolder: '../../resources/admin_lambdas',
  schemaFile: 'admin_schema.graphql',
  name:'AdminGraphQLAPI',
  authorizerLambda:'adminAppsyncAuthorizer',
  hasApiGateway:false,
  apiName:'AdminApi',
  needMigrate:false
});