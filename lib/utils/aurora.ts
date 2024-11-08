// Fetch the database credentials from Secrets Manager
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { env, isDev } from "./env";
import * as cdk from "aws-cdk-lib";
import { AURORA_CREDENTIALS_SECRET_NAME, AuroraStack, DB_NAME, SECRET_NAME } from "../bridgetower-aurora-stack";
import { Construct } from "constructs";

export interface DatabaseInfo {
  databaseUrl: string;
  host: string;
  port: string;
  dbName: string;
  secretName: string;
}

export const getDatabaseInfo = (scope: Construct, auroraStack: AuroraStack): DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretPartialArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, auroraStack.dbSecretArn.value);
  // Construct the DATABASE_URL environment variable for Prisma

  return {
    databaseUrl: cdk.Fn.join("", [
      "postgresql://",
      secret.secretValueFromJson("username").unsafeUnwrap(),
      ":",
      secret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      auroraStack.dbEndpoint.value,
      ":5432/",
      auroraStack.dbName.value
    ]),
    host: auroraStack.dbEndpoint.value,
    port: "5432",
    dbName: DB_NAME,
    secretName: SECRET_NAME
  };
};

export const getDevOrProdDatabaseInfo = (scope: Construct): DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(
    scope,
    env`${AURORA_CREDENTIALS_SECRET_NAME}`,
    "arn:aws:secretsmanager:us-east-1:339712796998:secret:rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb-oZhbs7"
  );
  // Construct the DATABASE_URL environment variable for Prisma
  return {
    databaseUrl: cdk.Fn.join("", [
      "postgresql://",
      secret.secretValueFromJson("username").unsafeUnwrap(),
      ":",
      secret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
      ":5432/",
      isDev() ? "dev" : "prod"
    ]),
    host: "schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com",
    port: "5432",
    dbName: isDev() ? "dev" : "prod",
    secretName: "rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb"
  };
};

export const getOnDemandProdDatabaseInfo = (scope: Construct): DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(
    scope,
    env`${AURORA_CREDENTIALS_SECRET_NAME}`,
    "arn:aws:secretsmanager:us-east-1:445567075701:secret:rds!cluster-13c2e436-ec01-4daa-ab51-0763d97fb0c9-LZtyqb"
  );
  // Construct the DATABASE_URL environment variable for Prisma
  return {
    databaseUrl: cdk.Fn.join("", [
      "postgresql://",
      secret.secretValueFromJson("username").unsafeUnwrap(),
      ":",
      secret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      "btappsyncstackondemandpro-auroraclusterondemandpro-lba9zr7yb1lo.cluster-cxmwgyku4xtz.us-east-1.rds.amazonaws.com",
      ":5432/",
      DB_NAME
    ]),
    host: "btappsyncstackondemandpro-auroraclusterondemandpro-lba9zr7yb1lo.cluster-cxmwgyku4xtz.us-east-1.rds.amazonaws.com",
    port: "5432",
    dbName: DB_NAME,
    secretName: "rds!cluster-13c2e436-ec01-4daa-ab51-0763d97fb0c9"
  };
};

export const getPlaygrounDevDatabaseInfo = (scope: Construct): DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(
    scope,
    env`${AURORA_CREDENTIALS_SECRET_NAME}`,
    "arn:aws:secretsmanager:us-east-1:222634369325:secret:rds!cluster-2b84579f-e4f3-42b0-b1ff-cc284c51fabb-kpmzlH"
  );
  // Construct the DATABASE_URL environment variable for Prisma
  return {
    databaseUrl: cdk.Fn.join("", [
      "postgresql://",
      secret.secretValueFromJson("username").unsafeUnwrap(),
      ":",
      secret.secretValueFromJson("password").unsafeUnwrap(),
      "@",
      "auroracluster-playground-dev.cluster-cvgkm26ccq9p.us-east-1.rds.amazonaws.com",
      ":5432/",
      DB_NAME
    ]),
    host: "auroracluster-playground-dev.cluster-cvgkm26ccq9p.us-east-1.rds.amazonaws.com",    
    
    port: "5432",
    dbName: DB_NAME,
    secretName: "rds!cluster-2b84579f-e4f3-42b0-b1ff-cc284c51fabb"
  };
};
