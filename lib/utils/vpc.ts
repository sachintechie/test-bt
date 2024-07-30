import {IVpc, Vpc} from "aws-cdk-lib/aws-ec2";
import {Construct} from "constructs";
import * as cdk from "aws-cdk-lib";
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { env, environment} from "./env";

let vpcSingleton:IVpc

export const getVpcConfig = (scope:Construct) => {
  switch (environment) {
    case "dev":
    case "prod":
      if(!vpcSingleton){
        vpcSingleton= Vpc.fromVpcAttributes(scope, env`vpc`,{
          vpcId: "vpc-02d0d267eb1e078f8",
          availabilityZones: cdk.Fn.getAzs(),
          privateSubnetIds: ["subnet-00a4eb60fb117cdd4", "subnet-04d671deee8eb1df2"]
        });
      }
      return vpcSingleton;
    default:
      if(!vpcSingleton){
        vpcSingleton= new ec2.Vpc(scope, env`vpc`, {
          maxAzs: 3,
          natGateways: 1,
        });
      }
      return vpcSingleton;
  }
}