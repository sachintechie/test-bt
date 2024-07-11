import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as iam from 'aws-cdk-lib/aws-iam';
import {BridgeTowerLambdaStack} from "./bridgetower-lambda-stack";
import {env, envConfig} from "./env";

export class BridgeTowerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import the existing LambdaStack
    const lambdaStack = new BridgeTowerLambdaStack(this,  env`BTLambdaStack`, {
      env: envConfig,
    });

    // Create a new AppSync GraphQL API
    const api = new appsync.GraphqlApi(this, 'Api', {
      name: env`GraphQLAPI`,
      schema: appsync.SchemaFile.fromAsset("../resources/appsync/schema.graphql"),
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        excludeVerboseContent: false,
        role: new iam.Role(this, env`AppSyncLoggingRole`, {
          assumedBy: new iam.ServicePrincipal('appsync.amazonaws.com'),
          managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppSyncPushToCloudWatchLogs')],
        }),
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.LAMBDA,
          lambdaAuthorizerConfig: {
            handler: lambdaStack.appsyncAuthorizerLambda,
            resultsCacheTtl: cdk.Duration.minutes(5), // Optional cache TTL
          },
        },
      },
    });



    // Create data sources for the existing Lambda functions
    const getWalletDataSource = api.addLambdaDataSource('GetWalletLambdaDataSource', lambdaStack.getWalletLambda);
    const transferDataSource = api.addLambdaDataSource('TransferLambdaDataSource', lambdaStack.transferLambda);

    // Create a resolver for the getWallet query
    getWalletDataSource.createResolver('GetWalletResolver', {
      typeName: 'Query',
      fieldName: 'getWallet',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
      {
        "version": "2018-05-29",
        "operation": "Invoke",
        "payload": {
          "identity": $util.toJson($ctx.identity),
          "resolverContext": $util.toJson($ctx.identity.resolverContext),
          "headers": $util.toJson($ctx.request.headers),
          "arguments": $util.toJson($ctx.arguments)
        }
      }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
      $util.toJson($ctx.result)
      `),
    });

    // Create a resolver for the transfer mutation
    transferDataSource.createResolver('TransferResolver', {
      typeName: 'Mutation',
      fieldName: 'transfer',
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
      {
        "version": "2018-05-29",
        "operation": "Invoke",
        "payload": {
          "identity": $util.toJson($ctx.identity),
          "resolverContext": $util.toJson($ctx.identity.resolverContext),
          "headers": $util.toJson($ctx.request.headers),
          "arguments": $util.toJson($ctx.arguments)
        }
      }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(`
        $util.toJson($context.result)
      `),
    });

    new cdk.CfnOutput(this, env`GraphQLAPIURL`, {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, env`GraphQLAPIKey`, {
      value: api.apiKey || '',
    });
  }
}
