#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { BridgeTowerLambdaStack } from "../lib/bridgetower-lambda-stack";

import {env, envConfig} from "../lib/config";

const app = new cdk.App();

// Create the stack with an environment-specific ID
new BridgeTowerLambdaStack(app, env`BTLambdaStack`, {
  env: envConfig,
});