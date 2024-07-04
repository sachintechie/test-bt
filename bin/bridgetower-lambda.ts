#!/usr/bin/env node
import "source-map-support/register";
import { App } from "aws-cdk-lib/core";
import * as cdk from "aws-cdk-lib";
import { BridgeTowerLambdaStack } from "../lib/bridgetower-lambda-stack";
// Define the environments
const devEnv: cdk.Environment = { account: "339712796998", region: "us-east-1" };
const prodEnv: cdk.Environment = { account: "339712796998", region: "us-west-2" };
const isProduction = process.env.NODE_ENV === "production";
const app = new App();
new BridgeTowerLambdaStack(app, "BridgeTowerLambdaStack", {
  // Defines the function url for the AWS Lambda
});

// const stackProps: cdk.StackProps = {
//   env: isProduction ? prodEnv : devEnv,
// };
//  new BridgeTowerLambdaStack(app, 'BridgeTowerLambdaStack', stackProps);
//  new BridgeTowerLambdaStack(app, 'BridgeTowerLambdaStack', { env: devEnv });
// new BridgeTowerLambdaStack(app, 'BridgeTowerLambdaStack-Prod', { env: prodEnv });
