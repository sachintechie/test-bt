import * as cdk from "aws-cdk-lib";
import { Stack, StackProps } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
export interface BridgeTowerStackProps extends StackProps {}

const DB_CONFIG = {
  DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
  DB_DATABASE: "dev",
  DB_PORT: "5432",
  SOLANA_NETWORK: "devnet",
  SOLANA_NETWORK_URL: "https://api.devnet.solana.com"
};

interface EnvStackProps extends StackProps {
  environment: string;
}
export class BridgeTowerLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: EnvStackProps) {
    super(scope, id, props);
    console.log(props);

    if (props.environment === 'dev') {
      console.log("Dev-specific resources");
    } else if (props.environment === 'staging') {
      console.log("Staging-specific resources");
    } else if (props.environment === 'prod') {
      console.log("Prod-specific resources")
    }

    const DefaultVpc = Vpc.fromVpcAttributes(this, "vpcdev", {
      vpcId: "vpc-02d0d267eb1e078f8",
      availabilityZones: cdk.Fn.getAzs(),
      privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
    });

    const securityGroups = [
      SecurityGroup.fromSecurityGroupId(this, "lambda-rds-6", "sg-0f6682da4f545d758"),
      SecurityGroup.fromSecurityGroupId(this, "default", "sg-05c044e1e87960084")
    ];

    const getWalletLambda = new NodejsFunction(this, "getWallet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/getWallet.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "appsyncAuthorizer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/appsyncAuthorizer.ts"),
      timeout: cdk.Duration.minutes(15),
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });
    new NodejsFunction(this, "apigatewayAuthorizer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/apigatewayAuthorizer.ts"),
      timeout: cdk.Duration.minutes(15),
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "getWalletBalance", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/getWalletBalance.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });
    
    new NodejsFunction(this, "deleteKeyAndUserFromCubistAndDB", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/deleteKeyAndUserFromCubistAndDB.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    

    new NodejsFunction(this, "checkTransactionStatusAndUpdate", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/checkTransactionStatusAndUpdate.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "checkAndTransferBonus", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/checkAndTransferBonus.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "listWalletTokens", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/listWalletTokens.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });
    new NodejsFunction(this, "createWallet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/createWallet.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "listCustomerWallets", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/listCustomerWallets.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "listStakeAccounts", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/listStakeAccounts.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "listStakeTransactions", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/listStakeTransactions.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    const transferLambda = new NodejsFunction(this, "transfer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/transfer.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });
    new NodejsFunction(this, "signin", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/signin.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    const stakingLambda = new NodejsFunction(this, "staking", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/staking.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "unStaking", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/unstaking.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "masterTransfer", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/masterTransfer.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432"
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "listWalletTransactions", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/listWalletTransactions.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: DB_CONFIG,
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "mergeStake", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/mergeStake.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        ...DB_CONFIG
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    new NodejsFunction(this, "withdrawStake", {
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../resources/withdrawStake.ts"),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        ...DB_CONFIG
      },
      vpc: DefaultVpc,
      securityGroups: securityGroups
    });

    // Defines the function url for the AWS Lambda
    const getWalletLambdaUrl = getWalletLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });
    const transferLambdaUrl = transferLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE
    });

    // print the function url after deployment
    new cdk.CfnOutput(this, "FunctionUrl", {
      value: getWalletLambdaUrl.url
    });
  }
}
