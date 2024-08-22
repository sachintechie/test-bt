import {Construct} from "constructs";
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from "aws-cdk-lib/aws-lambda";
import {env} from "./env";

export const newApiGateway = (scope: Construct,  lambda: lambda.Function) => {
  // Define the API Gateway
  const api = new apigateway.RestApi(scope, env`NFTMetadataApi`, {
    restApiName: 'NFT Metadata Service',
    description: 'This service fetches NFT metadata.',
  });

  // Create a /{contractAddress}/{tokenId} resource
  const contractAddress = api.root.addResource('{contractAddress}');
  const tokenId = contractAddress.addResource('{tokenId}');

  // Create an integration between the API Gateway and Lambda
  const lambdaIntegration = new apigateway.LambdaIntegration(lambda, {
    proxy: false,
    requestTemplates: {
      'application/json': `{
          "contractAddress": "$input.params('contractAddress')",
          "tokenId": "$input.params('tokenId')"
        }`
    }
  });

  // Add the GET method to the /{contractAddress}/{tokenId} resource
  tokenId.addMethod('GET', lambdaIntegration);

  return api;
}