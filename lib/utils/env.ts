import * as cdk from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib";
import {DatabaseInfo} from "./aurora";

const app = new cdk.App();
export const environment = app.node.tryGetContext("env");

export const isDevOrProd = () => {
  return environment === "dev"|| environment === "prod";
}

export const isSchoolhackProd = () => {
  return environment === "schoolhack-prod";
}

export const isDev = () => {
  return environment === "dev";
}

export const getEnvConfig = (databaseInfo:DatabaseInfo) => {
  const databaseInfoEnv = {
    DB_HOST: databaseInfo.host,
    DB_DATABASE: databaseInfo.dbName,
    DB_PORT: databaseInfo.port,
    SECRET_NAME: databaseInfo.secretName,
    DATABASE_URL: databaseInfo.databaseUrl
  }
  switch (environment) {
    case "dev":
      return {
        ...databaseInfoEnv,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
    case "staging":
      return {
        ...databaseInfoEnv,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
    case "prod":
      return {
        ...databaseInfoEnv,
        SOLANA_NETWORK: "mainnet",
        SOLANA_NETWORK_URL: "https://mainnet.helius-rpc.com/?api-key=c32a796d-9a0e-4c52-86b4-477f27a60b21",
        CS_API_ROOT: "https://prod.signer.cubist.dev"
      };
    case "schoolhack-prod":
        return {
          ...databaseInfoEnv,
          SOLANA_NETWORK: "mainnet",
          SOLANA_NETWORK_URL: "https://mainnet.helius-rpc.com/?api-key=c32a796d-9a0e-4c52-86b4-477f27a60b21",
          CS_API_ROOT: "https://prod.signer.cubist.dev"
        };
    default:
      return {
        ...databaseInfoEnv,
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

export function isDevLike(){
  return (environment as string).includes("dev");
}



export const envConfig: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION
};
