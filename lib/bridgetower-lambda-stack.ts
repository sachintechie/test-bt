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
  public readonly getWalletBalanceLambda: lambda.Function;
  public readonly deleteKeyAndUserFromCubistAndDBLambda: lambda.Function;
  public readonly checkTransactionStatusAndUpdateLambda: lambda.Function;
  public readonly checkAndTransferBonusLambda: lambda.Function;
  public readonly listWalletTokensLambda: lambda.Function;
  public readonly createWalletLambda: lambda.Function;
  public readonly listCustomerWalletsLambda: lambda.Function;
  public readonly listStakeAccountsLambda: lambda.Function;
  public readonly listStakeTransactionsLambda: lambda.Function;
  public readonly signinLambda: lambda.Function;
  public readonly stakingLambda: lambda.Function;
  public readonly unStakingLambda: lambda.Function;
  public readonly masterTransferLambda: lambda.Function;
  public readonly listWalletTransactionsLambda: lambda.Function;
  public readonly mergeStakeLambda: lambda.Function;
  public readonly withdrawStakeLambda: lambda.Function;
  public readonly apigatewayAuthorizerLambda: lambda.Function;
  public readonly getKycAccessTokenLambda: lambda.Function;
  public readonly getKycApplicantLambda: lambda.Function;
  public readonly kycWebhookLambda: lambda.Function;


  constructor(scope: Construct, id: string, props: StackProps) {

    super(scope, id, props);

    this.getWalletLambda=newNodeJsFunction(this, "getWallet", "../resources/getWallet.ts");
    this.transferLambda=newNodeJsFunction(this, "transfer", "../resources/transfer.ts");
    this.appsyncAuthorizerLambda=newNodeJsFunction(this, "appsyncAuthorizer", "../resources/appsyncAuthorizer.ts");
    this.getWalletBalanceLambda=newNodeJsFunction(this, "getWalletBalance", "../resources/getWalletBalance.ts");
    this.deleteKeyAndUserFromCubistAndDBLambda=newNodeJsFunction(this, "deleteKeyAndUserFromCubistAndDB", "../resources/deleteKeyAndUserFromCubistAndDB.ts");
    this.checkTransactionStatusAndUpdateLambda=newNodeJsFunction(this, "checkTransactionStatusAndUpdate", "../resources/checkTransactionStatusAndUpdate.ts");
    this.checkAndTransferBonusLambda=newNodeJsFunction(this, "checkAndTransferBonus", "../resources/checkAndTransferBonus.ts");
    this.listWalletTokensLambda=newNodeJsFunction(this, "listWalletTokens", "../resources/listWalletTokens.ts");
    this.createWalletLambda=newNodeJsFunction(this, "createWallet", "../resources/createWallet.ts");
    this.listCustomerWalletsLambda=newNodeJsFunction(this, "listCustomerWallets", "../resources/listCustomerWallets.ts");
    this.listStakeAccountsLambda=newNodeJsFunction(this, "listStakeAccounts", "../resources/listStakeAccounts.ts");
    this.listStakeTransactionsLambda=newNodeJsFunction(this, "listStakeTransactions", "../resources/listStakeTransactions.ts");
    this.signinLambda=newNodeJsFunction(this, "signin", "../resources/signin.ts");
    this.stakingLambda=newNodeJsFunction(this, "staking", "../resources/staking.ts");
    this.unStakingLambda=newNodeJsFunction(this, "unStaking", "../resources/unStaking.ts");
    this.masterTransferLambda=newNodeJsFunction(this, "masterTransfer", "../resources/masterTransfer.ts");
    this.listWalletTransactionsLambda=newNodeJsFunction(this, "listWalletTransactions", "../resources/listWalletTransactions.ts");
    this.mergeStakeLambda=newNodeJsFunction(this, "mergeStake", "../resources/mergeStake.ts");
    this.withdrawStakeLambda=newNodeJsFunction(this, "withdrawStake", "../resources/withdrawStake.ts");
    this.apigatewayAuthorizerLambda=newNodeJsFunction(this, "apigatewayAuthorizer", "../resources/apigatewayAuthorizer.ts");
    this.getKycAccessTokenLambda=newNodeJsFunction(this, "getKycAccessToken", "../resources/getKycAccessToken.ts");
    this.getKycApplicantLambda=newNodeJsFunction(this, "getKycApplicant", "../resources/getKycApplicant.ts");
    this.kycWebhookLambda=newNodeJsFunction(this, "kycWebhook", "../resources/kycWebhook.ts");



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
