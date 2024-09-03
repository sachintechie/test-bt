import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { env} from "./utils/env";
import {getVpcConfig} from "./utils/vpc";
import {getSecurityGroups} from "./utils/security_group";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";
import {IDatabaseCluster} from "aws-cdk-lib/aws-rds";

export const AURORA_CREDENTIALS_SECRET_NAME = 'AuroraCredentials';
export const DB_NAME = 'auroradb';
const USERNAME = 'auroraadmin'
export const SECRET_NAME=env`aurora-db-credentials`

export class AuroraStack extends cdk.Stack {
  public readonly dbEndpoint: cdk.CfnOutput;
  public readonly dbSecretArn: cdk.CfnOutput;
  public readonly dbName: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    let secret: ISecret;
    try {
      // Try to retrieve the existing secret by name
      secret = secretsmanager.Secret.fromSecretNameV2(this, env`${AURORA_CREDENTIALS_SECRET_NAME}`, SECRET_NAME);
    } catch (error) {
      // If the secret does not exist, create a new one
      secret = new secretsmanager.Secret(this, env`${AURORA_CREDENTIALS_SECRET_NAME}`, {
        secretName: SECRET_NAME,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: USERNAME,
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
          excludeCharacters: '!@#$%^&*()-_+=[]{}|;:,.<>?/`~',
        },
      });
    }
    

    let cluster: IDatabaseCluster;
    try {
      // Attempt to retrieve the existing RDS cluster by its identifier
      cluster = rds.DatabaseCluster.fromDatabaseClusterAttributes(this, env`AuroraCluster`, {
        clusterIdentifier: env`AuroraCluster`
      });
    } catch (error) {
      // Create the Aurora cluster
      cluster = new rds.DatabaseCluster(this, env`AuroraCluster`, {
        clusterIdentifier: env`AuroraCluster`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(secret),
        defaultDatabaseName: DB_NAME,
        instances: 2,
        instanceProps: {
          vpc:getVpcConfig(this),
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6I, ec2.InstanceSize.LARGE),
          securityGroups: getSecurityGroups(this),
          publiclyAccessible: true, // Make the database publicly accessible
        },
        storageEncrypted: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production use
      });
    }

    console.log(secret.secretArn)
    this.dbSecretArn = new cdk.CfnOutput(this, env`DBSecretArn`, {
      value: secret.secretArn,
      description: 'The ARN of the secret storing the DB credentials',
    });
  }
}