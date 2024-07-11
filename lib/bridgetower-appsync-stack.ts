import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BridgeTowerLambdaStack} from "./bridgetower-lambda-stack";
import {env, envConfig} from "./env";
import {configResolver, newAppSyncApi} from "./appsync";
import {capitalize} from "./utils";

const EXCLUDED_LAMBDAS_IN_APPSYNC = [
  'apigatewayAuthorizer',
  'appsyncAuthorizer',
  'checkAndTransferBonus',
  'checkTransactionStatusAndUpdate',
  'deleteKeyAndUserFromCubistAndDB',
  'mergeStake',
  'withdrawStake'
]

export class BridgeTowerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import the existing LambdaStack
    const lambdaStack = new BridgeTowerLambdaStack(this,  env`BTLambdaStack`, {
      env: envConfig,
    });

    // Create a new AppSync GraphQL API
    const api = newAppSyncApi(this, env`Api`, lambdaStack)

    // Create resolvers for each lambda function
    for (const [key, value] of lambdaStack.lambdaMap) {
      if (!EXCLUDED_LAMBDAS_IN_APPSYNC.includes(key)) {
        configResolver(api, value, 'Query', capitalize(key))
      }
    }

    new cdk.CfnOutput(this, env`GraphQLAPIURL`, {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, env`GraphQLAPIKey`, {
      value: api.apiKey || '',
    });
  }
}

