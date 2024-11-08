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

    STORE_AVAX_SUBNET_CONTRACT_ADDRESS: "0x1D57cd10148f382116127ad7eC8Ebb3a573D5792",
    METADATA_TABLE: "METADATA_TABLE",

    PROVENANCE_CONTRACT_ADDRESS: "tp1rhtzdffk4f5xk79sjede38lakuzrqcrxgx5337f0sfwrf7lwq4xqmkwst7",
    PROVENANCE_RPC_URL: "https://rpc.test.provenance.io:443",
    PROVENANCE_MNEMONIC: "your mnemonic phrase here"
  };
  const iamInfo = {
    ADMIN_GROUP: "Admin",
    ADMIN_ROLE: "arn:aws:iam::339712796998:role/service-role/admin"
  };
  const thirdPartyInfo = {
    STRIPE_SECRET: "sk_test_51Q5WSYRoB3vP63ZcG0446nZxieFZHLftc9TywVGeXSzDBwkO1YnyMxg4cuBBkGN8kPTjYYYUHtyF7eytbduUVrJ5005U9k0Jxi",
    STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET: 'whsec_mpDmxZjkszP88yuGFkmzv8kFvZoUhEPo'
  }
  const commonEnvs = {
    ...databaseInfoEnv,
    ...web3InfoEnv,
    ...iamInfo,
    ...thirdPartyInfo
  };
  switch (environment) {
    case "dev":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        AVAX_URL: "https://api.avax-test.network",
        AVAX_RPC_SUBNET_URL: "http://34.198.211.92:9650/ext/bc/CdfWeEQZPbWamfbDkxcwQqsH5JiubZ7aPu9cmxV8NSUT7daJh/rpc",
        AVAX_SUBNET_NETWORK_ID: "41024",
        AVAX_NETWORK_ID: "43113",
        PRODUCT_BUCKET_NAME: "meadowlandproductbucket",
        KB_BUCKET_NAME: "knowledgebasedocument",
        KB_ID: "WIKF9ALZ52",
        BEDROCK_DATASOURCE_S3: "ZZWKIZUS20"
      };
    case "ai-sovereignty-dev":
      return {
        ...commonEnvs,
        SOLANA_NETWORK: "devnet",
        SOLANA_NETWORK_URL: "https://api.devnet.solana.com",
        CS_API_ROOT: "https://gamma.signer.cubist.dev",
        AVAX_URL: "https://api.avax-test.network",
        AVAX_RPC_SUBNET_URL: "http://34.198.211.92:9650/ext/bc/CdfWeEQZPbWamfbDkxcwQqsH5JiubZ7aPu9cmxV8NSUT7daJh/rpc",
        AVAX_SUBNET_NETWORK_ID: "41024",
        AVAX_NETWORK_ID: "43113",
        KB_BUCKET_NAME: "bedrockkbdocumentdev",
        KB_ID: "X3RMAORSFE",
        BEDROCK_DATASOURCE_S3: "YQFKGJGVRR"
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
        AVAX_NETWORK_ID: "43113",
        PRODUCT_BUCKET_NAME: "meadowlandproductbucket"
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
