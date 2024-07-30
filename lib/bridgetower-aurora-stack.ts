import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {env} from "./utils/env";
import {getVpcConfig} from "./utils/vpc";
import {getSecurityGroups} from "./utils/security_group";

export const AURORA_CREDENTIALS_SECRET_NAME = 'AuroraCredentials';
const DB_NAME = 'auroradb';
const USERNAME = 'auroraadmin';

export class AuroraStack extends cdk.Stack {
  public readonly dbEndpoint: cdk.CfnOutput;
  public readonly dbSecretArn: cdk.CfnOutput;
  public readonly dbName: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    
    // Create a secret for the Aurora DB credentials
    const secret = new secretsmanager.Secret(this, env`${AURORA_CREDENTIALS_SECRET_NAME}`, {
      secretName: env`aurora-db-credentials`,
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

    // Create the Aurora cluster
    const cluster = new rds.DatabaseCluster(this, env`AuroraCluster`, {
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

    // Output the necessary environment variables
    this.dbEndpoint = new cdk.CfnOutput(this, env`DBEndpoint`, {
      value: cluster.clusterEndpoint.hostname,
      description: 'The endpoint of the Aurora cluster',
    });

    this.dbSecretArn = new cdk.CfnOutput(this, env`DBSecretArn`, {
      value: secret.secretArn,
      description: 'The ARN of the secret storing the DB credentials',
    });

    this.dbName = new cdk.CfnOutput(this, env`DBName`, {
      value:  DB_NAME,
      description: 'The name of the database',
    });
  }
}
