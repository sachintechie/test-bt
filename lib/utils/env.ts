import * as cdk from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib";

const app = new cdk.App();
export const environment = app.node.tryGetContext("env");

export const getEnvConfig = () => {
  switch (environment) {
    case "dev":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
    case "staging":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
    case "prod":
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "prod",
        DB_PORT: "5432",
        SOLANA_NETWORK: "mainnet",
        SOLANA_NETWORK_URL: "https://api.mainnet-beta.solana.com/",
        CS_API_ROOT: "https://prod.signer.cubist.dev"
      };
    default:
      return {
        DB_HOST: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
        DB_DATABASE: "dev",
        DB_PORT: "5432",
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
  }
};

export const getDescription = () => {
  return environment;
}

export function env(strings: TemplateStringsArray, ...values: any[]): string {
  // Concatenate the strings and values
  let result = "";
  strings.forEach((str, i) => {
    result += str + (values[i] || "");
  });

  // Append the environment name
  return result + "-" + environment;
}


export const envConfig: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};
