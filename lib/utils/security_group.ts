import {ISecurityGroup, SecurityGroup} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import {env, environment} from "./env";

let securityGroupsSingleton:ISecurityGroup[]

export const getSecurityGroups = (scope:Construct) => {
  switch (environment) {
    case "dev":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    case "staging":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    case "prod":
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
    default:
      if(!securityGroupsSingleton){
        securityGroupsSingleton=[
          SecurityGroup.fromSecurityGroupId(scope, env`lambda-rds-6`, "sg-0f6682da4f545d758"),
          SecurityGroup.fromSecurityGroupId(scope, env`default`, "sg-05c044e1e87960084")
        ]
      }
      return securityGroupsSingleton;
  }
}