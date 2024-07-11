import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {newNodeJsFunction} from "./lambda";

// !IMPORTANT:Schema query name should be consistent with resource file name
const LAMBDA_RESOURCE_NAMES=[
  "apigatewayAuthorizer",
  "appsyncAuthorizer",
  "checkAndTransferBonus",
  "checkTransactionStatusAndUpdate",
  "createWallet",
  "deleteKeyAndUserFromCubistAndDB",
  "getKycAccessToken",
  "getKycApplicant",
  "getWallet",
  "getWalletBalance",
  "kycWebhook",
  "listCustomerWallets",
  "listStakeAccounts",
  "listStakeTransactions",
  "listWalletTokens",
  "listWalletTransactions",
  "masterTransfer",
  "mergeStake",
  "signin",
  "staking",
  "transfer",
  "unstaking",
  "withdrawStake",
]

const APPSYNC_AUTHORIZER_LAMBDA_NAME="appsyncAuthorizer";


export class BridgeTowerLambdaStack extends Stack {
  public readonly lambdaMap: Map<string, lambda.Function>;

  get appsyncAuthorizerLambda(): lambda.Function {
    return this.lambdaMap.get(APPSYNC_AUTHORIZER_LAMBDA_NAME)!;
  }

  constructor(scope: Construct, id: string, props: StackProps) {

    super(scope, id, props);

    this.lambdaMap=new Map<string, lambda.Function>();
    for(const lambdaResourceName of LAMBDA_RESOURCE_NAMES){
      this.lambdaMap.set(lambdaResourceName, newNodeJsFunction(this, lambdaResourceName, `../resources/${lambdaResourceName}.ts`));
    }
  }
}
