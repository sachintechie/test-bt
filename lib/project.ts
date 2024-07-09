import * as cdk from 'aws-cdk-lib';
import {BridgeTowerLambdaStack} from "./bridgetower-lambda-stack";
import {env, envConfig} from "./config";

const app = new cdk.App();

// Create the stack with an environment-specific ID
new BridgeTowerLambdaStack(app, env`BridgeTowerLambdaStack`, {
  env: envConfig,
});
