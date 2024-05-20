import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface BridgeTowerStackProps extends StackProps {
  /** Retention policy for this stack */
}

export class BridgeTowerLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    //new createCubistUser.createCubistUser(this, 'createCubistUser');
    const createUserLambda = new lambda.Function(this, "getWallet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getWallet.handler",
      code: lambda.Code.fromAsset("resources"),
      environment: {
        ORG_ID: "Org#9716339d-a9af-4789-ba81-9747948fc026",
        CS_API_ROOT: "http://gamma.signer.cubist.dev",
        DB_HOST:
          "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_USER: "postgres",
        DB_PASSWORD: "Yp+3-A}BJR2WH<7OaL8aWoAjl~~2",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
      },
    });

    new lambda.Function(this, "authentication", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "authentication.handler",
      code: lambda.Code.fromAsset("resources"),
      environment: {
        DB_HOST:
          "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_USER: "postgres",
        DB_PASSWORD: "Yp+3-A}BJR2WH<7OaL8aWoAjl~~2",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
      },
    });

    new lambda.Function(this, "getWalletBalance", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getWalletBalance.handler",
      code: lambda.Code.fromAsset("resources"),
      environment: {
        DB_HOST:
          "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_USER: "postgres",
        DB_PASSWORD: "Yp+3-A}BJR2WH<7OaL8aWoAjl~~2",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
      },
    });

    // Defines the function url for the AWS Lambda
    const helloLambdaUrl = createUserLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
    });

    // print the function url after deployment
    new cdk.CfnOutput(this, "FunctionUrl", { value: helloLambdaUrl.url });
  }
}
