import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {BridgeTowerLambdaStack} from "./bridgetower-lambda-stack";
import {env, envConfig} from "./env";
import {configResolver, newAppSyncApi} from "./appsync";

export class BridgeTowerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Import the existing LambdaStack
    const lambdaStack = new BridgeTowerLambdaStack(this,  env`BTLambdaStack`, {
      env: envConfig,
    });

    // Create a new AppSync GraphQL API
    const api = newAppSyncApi(this, env`Api`, lambdaStack)

    configResolver(api, lambdaStack.getWalletLambda, 'Query', 'GetWallet')
    configResolver(api, lambdaStack.transferLambda, 'Query', 'Transfer')
    configResolver(api, lambdaStack.getWalletBalanceLambda, 'Query', 'GetWalletBalance')
    configResolver(api, lambdaStack.deleteKeyAndUserFromCubistAndDBLambda, 'Query', 'DeleteKeyAndUserFromCubistAndDB')
    configResolver(api, lambdaStack.checkTransactionStatusAndUpdateLambda, 'Query', 'CheckTransactionStatusAndUpdate')
    configResolver(api, lambdaStack.checkAndTransferBonusLambda, 'Query', 'CheckAndTransferBonus')
    configResolver(api, lambdaStack.listWalletTokensLambda, 'Query', 'ListWalletTokens')
    configResolver(api, lambdaStack.createWalletLambda, 'Query', 'CreateWallet')
    configResolver(api, lambdaStack.listCustomerWalletsLambda, 'Query', 'ListCustomerWallets')
    configResolver(api, lambdaStack.listStakeAccountsLambda, 'Query', 'ListStakeAccounts')
    configResolver(api, lambdaStack.listStakeTransactionsLambda, 'Query', 'ListStakeTransactions')
    configResolver(api, lambdaStack.signinLambda, 'Query', 'Signin')
    configResolver(api, lambdaStack.stakingLambda, 'Query', 'Staking')
    configResolver(api, lambdaStack.unStakingLambda, 'Query', 'UnStaking')
    configResolver(api, lambdaStack.masterTransferLambda, 'Query', 'MasterTransfer')
    configResolver(api, lambdaStack.listWalletTransactionsLambda, 'Query', 'ListWalletTransactions')
    configResolver(api, lambdaStack.mergeStakeLambda, 'Query', 'MergeStake')
    configResolver(api, lambdaStack.withdrawStakeLambda, 'Query', 'WithdrawStake')
    configResolver(api, lambdaStack.apigatewayAuthorizerLambda, 'Query', 'ApigatewayAuthorizer')
    configResolver(api, lambdaStack.getKycAccessTokenLambda, 'Query', 'GetKycAccessToken')
    configResolver(api, lambdaStack.getKycApplicantLambda, 'Query', 'GetKycApplicant')
    configResolver(api, lambdaStack.kycWebhookLambda, 'Query', 'KycWebhook')



    new cdk.CfnOutput(this, env`GraphQLAPIURL`, {
      value: api.graphqlUrl,
    });

    new cdk.CfnOutput(this, env`GraphQLAPIKey`, {
      value: api.apiKey || '',
    });
  }
}
