import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {newNodeJsFunction} from "./utils/lambda";
import {readFilesFromFolder} from "./utils/utils";
import {AuroraStack} from "./bridgetower-aurora-stack";
import * as cr from 'aws-cdk-lib/custom-resources';
import * as cdk from 'aws-cdk-lib';
import {env, envConfig, isDev, isDevOrProd} from "./utils/env";
import {
  DatabaseInfo,
  getDatabaseInfo,
  getDevOrProdDatabaseInfo
} from "./utils/aurora";


const APPSYNC_AUTHORIZER_LAMBDA_NAME="appsyncAuthorizer";
const MIGRATION_LAMBDA_NAME="migrateDB";

interface BridgeTowerLambdaStackProps extends StackProps {
  lambdaFolder: string;
}

export class BridgeTowerLambdaStack extends Stack {
  public readonly lambdaMap: Map<string, lambda.Function>;

  get appsyncAuthorizerLambda(): lambda.Function {
    return this.lambdaMap.get(APPSYNC_AUTHORIZER_LAMBDA_NAME)!;
  }

  constructor(scope: Construct, id: string, props: BridgeTowerLambdaStackProps) {

    super(scope, id, props);

    this.lambdaMap=new Map<string, lambda.Function>();

    let databaseInfo:DatabaseInfo;
    if(!isDevOrProd()){
      // Import the Aurora stack
      const auroraStack = new AuroraStack(this, env`BTAuroraStack`, {
        env:envConfig
      });
      // Fetch the database credentials from Secrets Manager
       databaseInfo = getDatabaseInfo(this, auroraStack);
    }else{
       databaseInfo = getDevOrProdDatabaseInfo(this);
    }
    console.log(databaseInfo);

    const lambdaResourceNames = readFilesFromFolder(props.lambdaFolder);
    for(const lambdaResourceName of lambdaResourceNames){
      this.lambdaMap.set(lambdaResourceName, newNodeJsFunction(this, lambdaResourceName, `${props.lambdaFolder}/${lambdaResourceName}.ts`, databaseInfo));
    }


    if(!isDevOrProd()){
      // Create a custom resource to trigger the migration Lambda function
      const provider = new cr.Provider(this, env`MigrateProvider`, {
        onEventHandler: this.lambdaMap.get(MIGRATION_LAMBDA_NAME)!,
      });

      new cdk.CustomResource(this, env`MigrateResource`, { serviceToken: provider.serviceToken,properties:{version:'0.0.5'} });
    }
  }
}
