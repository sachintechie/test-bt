// Fetch the database credentials from Secrets Manager
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import {env} from "./env";
import * as cdk from "aws-cdk-lib";
import {AURORA_CREDENTIALS_SECRET_NAME, AuroraStack} from "../bridgetower-aurora-stack";
import {Construct} from "constructs";

export const getDatabaseUrl = (scope: Construct,auroraStack:AuroraStack):string => {
  const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, env`${AURORA_CREDENTIALS_SECRET_NAME}`, auroraStack.dbSecretArn.value);

  // Construct the DATABASE_URL environment variable for Prisma
  return cdk.Fn.join('', [
    'postgresql://',
    secret.secretValueFromJson('username').unsafeUnwrap(),
    ':',
    secret.secretValueFromJson('password').unsafeUnwrap(),
    '@',
    auroraStack.dbEndpoint.value,
    ':5432/',
    auroraStack.dbName.value,
  ]);

}