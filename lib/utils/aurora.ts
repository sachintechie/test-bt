// Fetch the database credentials from Secrets Manager
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {env, isDev, isDevLike} from "./env";
import * as cdk from "aws-cdk-lib";
import {
  AURORA_CREDENTIALS_SECRET_NAME,
  AuroraStack,
  DB_NAME,
  PROD_DB_NAME,
  SECRET_NAME
} from "../bridgetower-aurora-stack";
import {Construct} from "constructs";

export interface DatabaseInfo {
  databaseUrl:string,
  host:string,
  port:string,
  dbName:string,
  secretName:string
}

export const getDatabaseInfo = (scope: Construct,auroraStack:AuroraStack):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, auroraStack.dbSecretArn.value);
  // Construct the DATABASE_URL environment variable for Prisma
  return {databaseUrl:cdk.Fn.join('', [
    'postgresql://',
    secret.secretValueFromJson('username').unsafeUnwrap(),
    ':',
    secret.secretValueFromJson('password').unsafeUnwrap(),
    '@',
    auroraStack.dbEndpoint.value,
    ':5432/',
    auroraStack.dbName.value,
  ]),
    host:auroraStack.dbEndpoint.value,
    port:"5432",
    dbName:isDevLike()?DB_NAME:PROD_DB_NAME,
    secretName:SECRET_NAME
  };
}

export const getDevOrProdDatabaseInfo = (scope: Construct):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, 'arn:aws:secretsmanager:us-east-1:339712796998:secret:rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb-oZhbs7');
  // Construct the DATABASE_URL environment variable for Prisma
  return {databaseUrl:cdk.Fn.join('', [
    'postgresql://',
    secret.secretValueFromJson('username').unsafeUnwrap(),
    ':',
    secret.secretValueFromJson('password').unsafeUnwrap(),
    '@',
    'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    ':5432/',
      isDev()?"dev":"prod",
  ]),
    host:'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    port:"5432",
    dbName: isDev()?"dev":"prod",
    secretName:SECRET_NAME
  };
}

export const getSchoolhackProdDatabaseInfo = (scope: Construct):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, 'arn:aws:secretsmanager:us-east-1:010928220518:secret:aurora-db-credentials-schoolhack-dev-ZXtymM');
  // Construct the DATABASE_URL environment variable for Prisma
  return {databaseUrl:cdk.Fn.join('', [
      'postgresql://',
      secret.secretValueFromJson('username').unsafeUnwrap(),
      ':',
      secret.secretValueFromJson('password').unsafeUnwrap(),
      '@',
      'btappsyncstackschoolhackd-auroraclusterschoolhackd-a5d1ljzhz7ux.cluster-cvk24k6w6y5j.us-east-1.rds.amazonaws.com',
      ':5432/',
      isDevLike()?DB_NAME:PROD_DB_NAME,
    ]),
    host:'btappsyncstackschoolhackd-auroraclusterschoolhackd-a5d1ljzhz7ux.cluster-cvk24k6w6y5j.us-east-1.rds.amazonaws.com',
    port:"5432",
    dbName: isDevLike()?DB_NAME:PROD_DB_NAME,
    secretName:'aurora-db-credentials-schoolhack-dev'
  };
}