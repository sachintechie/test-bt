import * as appsync from "aws-cdk-lib/aws-appsync";
import {env} from "./env";
import * as path from "path";
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib";
import {Construct} from "constructs";
import {BridgeTowerLambdaStack} from "../bridgetower-lambda-stack";
import {GraphqlApi} from "aws-cdk-lib/aws-appsync";
import {IFunction} from "aws-cdk-lib/aws-lambda";

export const newAppSyncApi = (scope: Construct, id: string, lambdaStack: BridgeTowerLambdaStack) => {
  return  new appsync.GraphqlApi(scope, env`${id}`, {
    name: env`GraphQLAPI`,
    schema: appsync.SchemaFile.fromAsset(path.join(__dirname, "../../resources/appsync/schema.graphql")),
    logConfig: {
      fieldLogLevel: appsync.FieldLogLevel.ALL,
      excludeVerboseContent: false,
      role: new iam.Role(scope, env`AppSyncLoggingRole`, {
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
}

export const configResolver =(api:GraphqlApi,lambda:IFunction,typeName:string,fieldName:string)=>{
  const dataSource=api.addLambdaDataSource(env`${fieldName}LambdaDataSource`, lambda);
  dataSource.createResolver(env`${fieldName}Resolver`, {
    typeName: typeName,
    fieldName: fieldName,
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
}