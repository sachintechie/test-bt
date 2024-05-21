#!/usr/bin/env node
import 'source-map-support/register';
import {App } from "aws-cdk-lib/core";
import { BridgeTowerLambdaStack } from '../lib/bridgetower-lambda-stack';


const app = new App();
new BridgeTowerLambdaStack(app, 'BridgeTowerLambdaStack', {
 // Defines the function url for the AWS Lambda


})

