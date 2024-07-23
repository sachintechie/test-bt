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
    dbName:auroraStack.dbName.value,
    secretName:secret.secretName
  };
}

export const getDevOrProdDatabaseInfo = (scope: Construct):DatabaseInfo => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, 'arn:aws:secretsmanager:us-east-1:339712796998:secret:rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb-oZhbs7');
  // Construct the DATABASE_URL environment variable for Prisma
  console.log('RYON check secret')
  const username = cdk.Token.asString(secret.secretValueFromJson('username'));
  const password = secret.secretValueFromJson('password').unsafeUnwrap();
  console.log(username)
  console.log(password)
  const encodedPassword = Fn.join('', password.split('').map(char => {
    switch (char) {
      case ':': return '%3A';
      case '/': return '%2F';
      case '?': return '%3F';
      case '#': return '%23';
      case '[': return '%5B';
      case ']': return '%5D';
      case '@': return '%40';
      case '!': return '%21';
      case '$': return '%24';
      case '&': return '%26';
      case '\'': return '%27';
      case '(': return '%28';
      case ')': return '%29';
      case '*': return '%2A';
      case '+': return '%2B';
      case ',': return '%2C';
      case ';': return '%3B';
      case '=': return '%3D';
      case '%': return '%25';
      case ' ': return '%20';
      default: return char;
    }
  }));
  console.log(encodedPassword)
  return {databaseUrl:cdk.Fn.join('', [
    'postgresql://',
    secret.secretValueFromJson('username').unsafeUnwrap(),
    ':', encodedPassword,
    '@',
    'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    ':5432/',
      isDev()?"dev":"prod",
  ]),
    host:'schoolhack-instance-1.cr0swqk86miu.us-east-1.rds.amazonaws.com',
    port:"5432",
    dbName: isDev()?"dev":"prod",
    secretName:secret.secretName
  };
}