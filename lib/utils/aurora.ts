// Fetch the database credentials from Secrets Manager
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {env, isDev} from "./env";
import * as cdk from "aws-cdk-lib";
import {AURORA_CREDENTIALS_SECRET_NAME, AuroraStack} from "../bridgetower-aurora-stack";
import {Construct} from "constructs";
import {Fn} from "aws-cdk-lib";

export interface DatabaseInfo {
  databaseUrl:string,
  host:string,
  port:string,
  dbName:string,
  secretName:string
}

export const getDatabaseInfo = (scope: Construct,auroraStack:AuroraStack):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, auroraStack.dbSecretArn.value);
  const username = secret.secretValueFromJson('username').unsafeUnwrap();
  const password = secret.secretValueFromJson('password').unsafeUnwrap();
  const encodedPassword = urlEncode(password);
  // Construct the DATABASE_URL environment variable for Prisma
  return {databaseUrl:cdk.Fn.join('', [
    'postgresql://',
    username,
    ':',
    encodedPassword,
    '@',
    auroraStack.dbEndpoint.value,
    ':5432/',
    auroraStack.dbName.value,
  ]),
    host:auroraStack.dbEndpoint.value,
    port:"5432",
    dbName:auroraStack.dbName.value,
    secretName:secret.secretName
  };
}

export const getDevOrProdDatabaseInfo = (scope: Construct):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, 'arn:aws:secretsmanager:us-east-1:339712796998:secret:rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb-oZhbs7');
  const databaseUrl = Fn.sub('postgresql://${username}:${encodedPassword}@${dbEndpoint}:5432/${dbName}', {
    username: secret.secretValueFromJson('username').unsafeUnwrap(),
    encodedPassword: secret.secretValueFromJson('password').unsafeUnwrap(),
    dbEndpoint: 'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    dbName: isDev()?"dev":"prod",
  });
  console.log('databaseUrl',databaseUrl)
  // Construct the DATABASE_URL environment variable for Prisma
  return {databaseUrl,
    host:'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    port:"5432",
    dbName: isDev()?"dev":"prod",
    secretName:secret.secretName
  };
}

// Function to URL-encode the password
function urlEncode(str:string) {
  return encodeURIComponent(str)
    .replace(/%20/g, '+')
    .replace(/%21/g, '!')
    .replace(/%24/g, '$')
    .replace(/%26/g, '&')
    .replace(/%27/g, "'")
    .replace(/%28/g, '(')
    .replace(/%29/g, ')')
    .replace(/%2A/g, '*')
    .replace(/%2B/g, '+')
    .replace(/%2C/g, ',')
    .replace(/%2F/g, '/')
    .replace(/%3A/g, ':')
    .replace(/%3B/g, ';')
    .replace(/%3D/g, '=')
    .replace(/%3F/g, '?')
    .replace(/%40/g, '@')
    .replace(/%5B/g, '[')
    .replace(/%5D/g, ']');
}