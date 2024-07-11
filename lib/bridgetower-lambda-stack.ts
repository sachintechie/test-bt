import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {newNodeJsFunction} from "./lambda";
import {env} from "./env";


export class BridgeTowerLambdaStack extends Stack {
  public readonly getWalletLambda: lambda.Function;
  public readonly transferLambda: lambda.Function;
  public readonly appsyncAuthorizerLambda: lambda.Function;
  constructor(scope: Construct, id: string, props: StackProps) {

    super(scope, id, props);

    this.getWalletLambda=newNodeJsFunction(this, "getWallet", "../resources/getWallet.ts");
    this.transferLambda=newNodeJsFunction(this, "transfer", "../resources/transfer.ts");
    this.appsyncAuthorizerLambda=newNodeJsFunction(this, "appsyncAuthorizer", "../resources/appsyncAuthorizer.ts");
    newNodeJsFunction(this, "getWalletBalance", "../resources/getWalletBalance.ts");
    newNodeJsFunction(this, "deleteKeyAndUserFromCubistAndDB", "../resources/deleteKeyAndUserFromCubistAndDB.ts");
    newNodeJsFunction(this, "checkTransactionStatusAndUpdate", "../resources/checkTransactionStatusAndUpdate.ts");
    newNodeJsFunction(this, "checkAndTransferBonus", "../resources/checkAndTransferBonus.ts");
    newNodeJsFunction(this, "listWalletTokens", "../resources/listWalletTokens.ts");
    newNodeJsFunction(this, "createWallet", "../resources/createWallet.ts");
    newNodeJsFunction(this, "listCustomerWallets", "../resources/listCustomerWallets.ts");
    newNodeJsFunction(this, "listStakeAccounts", "../resources/listStakeAccounts.ts");
    newNodeJsFunction(this, "listStakeTransactions", "../resources/listStakeTransactions.ts");
    newNodeJsFunction(this, "signin", "../resources/signin.ts");
    newNodeJsFunction(this, "staking", "../resources/staking.ts");
    newNodeJsFunction(this, "unStaking", "../resources/unstaking.ts");
    newNodeJsFunction(this, "masterTransfer", "../resources/masterTransfer.ts");
    newNodeJsFunction(this, "listWalletTransactions", "../resources/listWalletTransactions.ts");
    newNodeJsFunction(this, "mergeStake", "../resources/mergeStake.ts");
    newNodeJsFunction(this, "withdrawStake", "../resources/withdrawStake.ts");
    newNodeJsFunction(this, "apigatewayAuthorizer", "../resources/apigatewayAuthorizer.ts");
    newNodeJsFunction(this, "appsyncAuthorizer", "../resources/appsyncAuthorizer.ts");
    newNodeJsFunction(this, "getKycAccessToken", "../resources/getKycAccessToken.ts");
    newNodeJsFunction(this, "getKycApplicant", "../resources/getKycApplicant.ts");
    newNodeJsFunction(this, "kycWebhook", "../resources/kycWebhook.ts");

    // Define function URLs for specific Lambdas
    const getWalletLambdaUrl = this.getWalletLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });
    const transferLambdaUrl = this.transferLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    new cdk.CfnOutput(this, env`GetWalletFunctionUrl`, {
      value: getWalletLambdaUrl.url
    });
    new cdk.CfnOutput(this, env`TransferFunctionUrl`, {
      value: transferLambdaUrl.url
    });
  }
}
