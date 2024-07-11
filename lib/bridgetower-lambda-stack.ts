import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {newNodeJsFunction} from "./lambda";
import {readFilesFromFolder} from "./utils";


const APPSYNC_AUTHORIZER_LAMBDA_NAME="appsyncAuthorizer";

export class BridgeTowerLambdaStack extends Stack {
  public readonly lambdaMap: Map<string, lambda.Function>;

  get appsyncAuthorizerLambda(): lambda.Function {
    return this.lambdaMap.get(APPSYNC_AUTHORIZER_LAMBDA_NAME)!;
  }

  constructor(scope: Construct, id: string, props: StackProps) {

    super(scope, id, props);

    this.lambdaMap=new Map<string, lambda.Function>();

    const lambdaResourceNames = readFilesFromFolder("../resources/lambdas");
    for(const lambdaResourceName of lambdaResourceNames){
      this.lambdaMap.set(lambdaResourceName, newNodeJsFunction(this, lambdaResourceName, `../resources/lambdas/${lambdaResourceName}.ts`));
    }
  }
}
