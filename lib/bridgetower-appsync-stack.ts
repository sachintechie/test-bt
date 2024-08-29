import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BridgeTowerLambdaStack} from "./bridgetower-lambda-stack";
import {env, envConfig} from "./utils/env";
import {configResolver, newAppSyncApi} from "./utils/appsync";
import {capitalize} from "./utils/utils";
import {newApiGateway} from "./utils/apigateway";

const EXCLUDED_LAMBDAS_IN_APPSYNC = [
  'apigatewayAuthorizer',
  'appsyncAuthorizer',
  'checkAndTransferBonus',
  'checkTransactionStatusAndUpdate',
  'createKycApplicant',
  'deleteKeyAndUserFromCubistAndDB',
  'migrateDB',
  'createOrganizationUnitAndAwsAccount',
  'batchMintCnft'
]

const GET_METADATA="getMetadata";

const MUTATIONS=[
  'createCategory',
  'createProduct',
  'createProductAttribute',
  'adminTransfer'
]

interface AppSyncStackProps extends cdk.StackProps {
  lambdaFolder: string;
  schemaFile: string;
  name: string;
}


export class BridgeTowerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AppSyncStackProps) {
    super(scope, id, props);

    // Import the existing LambdaStack
    const lambdaStack = new BridgeTowerLambdaStack(this,  env`BTLambdaStack`, {
      env: envConfig,
      lambdaFolder: props.lambdaFolder
    });

    // Create a new AppSync GraphQL API
    const api = newAppSyncApi(this, env`Api`, props.name,lambdaStack,props.schemaFile)

    const gateway = newApiGateway(this,  lambdaStack.lambdaMap.get(GET_METADATA)!);

    // Create resolvers for each lambda function
    for (const [key, value] of lambdaStack.lambdaMap) {
      if (!EXCLUDED_LAMBDAS_IN_APPSYNC.includes(key)) {
        configResolver(api, value, MUTATIONS.includes(key)?'Mutation':'Query', capitalize(key))
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

