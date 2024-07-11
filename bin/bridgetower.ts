#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import {env, envConfig} from "../lib/env";
import {BridgeTowerAppSyncStack} from "../lib/bridgetower-appsync-stack";


const app = new cdk.App();

// Create the stack with an environment-specific ID
new BridgeTowerAppSyncStack(app, env`BTAppSyncStack`, {
  env: envConfig,
});