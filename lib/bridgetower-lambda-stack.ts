import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {newNodeJsFunction} from "./utils/lambda";
import {readFilesFromFolder} from "./utils/utils";
import {AuroraStack} from "./bridgetower-aurora-stack";
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cdk from 'aws-cdk-lib';
import {env} from "./utils/env";
import {getDatabaseUrl} from "./utils/aurora";


const APPSYNC_AUTHORIZER_LAMBDA_NAME="appsyncAuthorizer";
const MIGRATION_LAMBDA_NAME="migrateDB";

export class BridgeTowerLambdaStack extends Stack {
  public readonly lambdaMap: Map<string, lambda.Function>;

  get appsyncAuthorizerLambda(): lambda.Function {
    return this.lambdaMap.get(APPSYNC_AUTHORIZER_LAMBDA_NAME)!;
  }

  constructor(scope: Construct, id: string, props: StackProps) {

    super(scope, id, props);

    this.lambdaMap=new Map<string, lambda.Function>();

    // Import the Aurora stack
    const auroraStack = new AuroraStack(scope, env`BTAuroraStack`);

    // Fetch the database credentials from Secrets Manager
    const databaseUrl = getDatabaseUrl(scope, auroraStack);

    const lambdaResourceNames = readFilesFromFolder("../resources/lambdas");
    for(const lambdaResourceName of lambdaResourceNames){
      this.lambdaMap.set(lambdaResourceName, newNodeJsFunction(this, lambdaResourceName, `../resources/lambdas/${lambdaResourceName}.ts`, databaseUrl));
    }

    // Create a custom resource to trigger the migration Lambda function
    const provider = new cr.Provider(this, env`MigrateProvider`, {
      onEventHandler: this.lambdaMap.get(MIGRATION_LAMBDA_NAME)!,
    });

    new cdk.CustomResource(this, env`MigrateResource`, { serviceToken: provider.serviceToken });
  }
}
