import { ISecurityGroup, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { env, environment } from "./env";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { getVpcConfig } from "./vpc";

let securityGroupsSingleton: ISecurityGroup[];

export const getSecurityGroups = (scope: Construct) => {
  switch (environment) {
    case "dev":
    case "prod":
      if (!securityGroupsSingleton) {
        securityGroupsSingleton = [
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ];
      }
      return securityGroupsSingleton;
    case "ondemand-prod":
      if (!securityGroupsSingleton) {
        securityGroupsSingleton = [SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f661eeab7d58bee8")];
      }
      return securityGroupsSingleton;
    case "playground-dev":
      if (!securityGroupsSingleton) {
          securityGroupsSingleton = [SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-05ddd1b0128d3ffa0")];
        }
        return securityGroupsSingleton;  
    default:
      if (!securityGroupsSingleton) {
        // Create a security group for the Aurora DB Cluster
        const securityGroup = new ec2.SecurityGroup(scope, env`SecurityGroup`, {
          vpc: getVpcConfig(scope),
          allowAllOutbound: true,
          description: "Allow access to Aurora cluster"
        });

        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.allTcp(), "Allow access from the internet");

        securityGroupsSingleton = [securityGroup];
      }
      return securityGroupsSingleton;
  }
};
