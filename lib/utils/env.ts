import * as cdk from "aws-cdk-lib";
import { Environment } from "aws-cdk-lib";
import { DatabaseInfo } from "./aurora";

const app = new cdk.App();
export const environment = app.node.tryGetContext("env");

export const isDevOrProd = () => {
  return environment === "dev" || environment === "prod";
};

export const isOnDemandProd = () => {
  return environment === "ondemand-prod";
};

export const isPlaygroundDev = () => {
  return environment === "playground-dev";
};

export const isDev = () => {
  return environment === "dev";
};

export const getEnvConfig = (databaseInfo: DatabaseInfo) => {
  const databaseInfoEnv = {
    DB_HOST: databaseInfo.host,
    DB_DATABASE: databaseInfo.dbName,
    DB_PORT: databaseInfo.port,
    SECRET_NAME: databaseInfo.secretName,
    DATABASE_URL: databaseInfo.databaseUrl
  };
  const web3InfoEnv = {
    AVAX_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
    ETH_RPC_URL: "https://api.avax-test.network/ext/bc/C/rpc",
    PRIVATE_KEY: "0xaae1f02aea6da4ae54d4adcbb47ce41af11fa4e71c2527d356a845cbf771418e",
    AVAX_PRIVATE_KEY: "68ff1b25786aec4108dd91e974528cb8035b9f2f5315de90a7a5e429a7ae36d2",
    STORE_AVAX_CONTRACT_ADDRESS: "0x7b72b77b930656591D0281DEC0532cA6a4a55AB4",
    METADATA_TABLE: "METADATA_TABLE"
  };
  const iamInfo = {
    ADMIN_GROUP: "Admin",
    ADMIN_ROLE: "arn:aws:iam::339712796998:role/service-role/admin"
  };
  const commonEnvs = {
    ...databaseInfoEnv,
    ...web3InfoEnv,
    ...iamInfo
  };
  switch (environment) {
    case "dev":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        AVAX_URL: "https://api.avax-test.network",
        AVAX_NETWORK_ID: "43113"
      };
    case "staging":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev"
      };
    case "prod":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "mainnet",
        SOLANA_NETWORK_URL: "https://mainnet.helius-rpc.com/?api-key=c32a796d-9a0e-4c52-86b4-477f27a60b21",
        CS_API_ROOT: "https://prod.signer.cubist.dev",
        AVAX_URL: "https://api.avax.network",
        AVAX_NETWORK_ID: "1"
      };
    case "schoolhack-prod":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "mainnet",
        SOLANA_NETWORK_URL: "https://mainnet.helius-rpc.com/?api-key=c32a796d-9a0e-4c52-86b4-477f27a60b21",
        CS_API_ROOT: "https://prod.signer.cubist.dev",
        AVAX_URL: "https://api.avax.network",
        AVAX_NETWORK_ID: "1"
      };
    case "ondemand-prod":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "mainnet",
        SOLANA_NETWORK_URL: "https://mainnet.helius-rpc.com/?api-key=c32a796d-9a0e-4c52-86b4-477f27a60b21",
        CS_API_ROOT: "https://prod.signer.cubist.dev",
        AVAX_URL: "https://api.avax.network",
        AVAX_NETWORK_ID: "1"
      };
    default:
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        AVAX_URL: "https://api.avax-test.network",
        AVAX_NETWORK_ID: "43113"
      };
  }
};

export const getDescription = () => {
  return environment;
};

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
