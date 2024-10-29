import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { env } from "./env";

export const newApiGateway = (scope: Construct, lambda: lambda.Function) => {
  // Define the API Gateway
  const api = new apigateway.RestApi(scope, env`NFTMetadataApi`, {
    restApiName: "NFT Metadata Service",
    description: "This service fetches NFT metadata."
  });

  // Create a /{contractAddress}/{tokenId} resource
  const contractAddress = api.root.addResource("{contractAddress}");
  const tokenId = contractAddress.addResource("{tokenId}");

  // Create an integration between the API Gateway and Lambda
  const lambdaIntegration = new apigateway.LambdaIntegration(lambda, {
    proxy: false,
    requestTemplates: {
      "application/json": `{
          "contractAddress": "$input.params('contractAddress')",
          "tokenId": "$input.params('tokenId')"
        }`
    },
    integrationResponses: [
      {
        statusCode: "200",
        responseTemplates: {
          "application/json": `#set($inputRoot = $input.path('$.metadata'))
            {
              "TokenId": "$inputRoot.TokenId",
              "ContractAddressTokenId": "$inputRoot.ContractAddressTokenId",
              "ContractAddress": "$inputRoot.ContractAddress"
            }`
        }
      },
      {
        // This handles any errors that might occur and returns a 500 status code
        statusCode: "500",
        responseTemplates: {
          "application/json": `{
              "error": "An error occurred while processing your request."
            }`
        }
      }
    ]
  });

  // Add the GET method to the /{contractAddress}/{tokenId} resource
  tokenId.addMethod("GET", lambdaIntegration, {
    methodResponses: [
      {
        // Define the response status code and its corresponding models (can be empty)
        statusCode: "200",
        responseModels: {
          "application/json": apigateway.Model.EMPTY_MODEL
        }
      },
      {
        // Error response status code
        statusCode: "500",
        responseModels: {
          "application/json": apigateway.Model.EMPTY_MODEL
        }
      }
    ]
  });

  return api;
};

export const newStripeWebhookApiGateway = (scope: Construct, lambda: lambda.Function) => {
  // Define the API Gateway
  const api = new apigateway.RestApi(scope, 'StripeWebhookApi', {
    restApiName: 'Stripe Webhook API',
    description: 'API Gateway for handling Stripe webhooks',
  });

  // Create the /webhook resource
  const webhookResource = api.root.addResource('webhook');

  // Define the mapping template to decode the Base64-encoded body
  const requestTemplate = `{
  "method": "$context.httpMethod",
  "body": $input.json('$'),
  "rawBody": "$util.escapeJavaScript($input.body).replaceAll("\\\\'", "'")",
  "headers": {
    #foreach($param in $input.params().header.keySet())
    "$param": "$util.escapeJavaScript($input.params().header.get($param))"
    #if($foreach.hasNext),#end
    #end
  }
}`;

  // Create a Lambda integration with the mapping template
  const lambdaIntegration = new apigateway.LambdaIntegration(lambda, {
    proxy: false, // Use custom integration to apply the mapping template
    requestTemplates: {
      'application/json': requestTemplate,
    },
  });

  // Add POST method to /webhook resource
  webhookResource.addMethod('POST', lambdaIntegration, {
    methodResponses: [
      { statusCode: '200' },
      { statusCode: '400' },
      { statusCode: '500' },
    ],
  });

  return api;
};

export const newMoonpayApiGateway = (scope: Construct, assetLambda: lambda.Function,deliveryLambda:lambda.Function,transactionStatusLambda:lambda.Function) => {
  // Define the API Gateway
  const api = new apigateway.RestApi(scope, 'MoonpayApi', {
    restApiName: 'Moonpay API',
    description: 'API Gateway for handling Moonpay webhooks',
  });

  // Create the /asset resource
  const asset_info = api.root.addResource('asset_info');
  const contractAddress = asset_info.addResource('{contractAddress}');
  const tokenId = contractAddress.addResource('{tokenId}');


  // Define the mapping template to decode the Base64-encoded body
  const requestTemplate = `{
    "contractAddress": "$input.params('contractAddress')",
    "tokenId": "$input.params('tokenId')"
  }`;

  const integrationResponses =  [
    {
      statusCode: "200",
      responseTemplates: {
        "application/json": `#set($inputRoot = $input.path('$'))
        {
          "tokenId": "$inputRoot.asset.tokenId",
          "contractAddress": "$inputRoot.asset.contractAddress",
          "name": "$inputRoot.asset.name",
          "collection": "$inputRoot.asset.collection",
          "imageUrl": "$inputRoot.asset.imageUrl",
          "explorerUrl": "$inputRoot.asset.explorerUrl",
          "price": $inputRoot.asset.price,
          "priceCurrencyCode": "$inputRoot.asset.priceCurrencyCode",
          "quantity": $inputRoot.asset.quantity,
          "sellerAddress": "$inputRoot.asset.sellerAddress",
          "sellType": "$inputRoot.asset.sellType",
          "flow": "$inputRoot.asset.flow",
          "network": "$inputRoot.asset.network"
        }`
      }
    },
    {
      // This handles any errors that might occur and returns a 500 status code
      statusCode: "500",
      responseTemplates: {
        "application/json": `{
              "error": "An error occurred while processing your request."
            }`
      }
    }
  ]


  // Create a Lambda integration with the mapping template
  const assetLambdaIntegration = new apigateway.LambdaIntegration(assetLambda, {
    proxy: false, // Use custom integration to apply the mapping template
    requestTemplates: {
      'application/json': requestTemplate,
    },
    integrationResponses
  });

  // Add POST method to /webhook resource
  tokenId.addMethod('GET', assetLambdaIntegration, {
    methodResponses: [
      { statusCode: '200',responseModels: { "application/json": apigateway.Model.EMPTY_MODEL} },
    ],
  });

  const optionsResponse = {
    statusCode: '200',
    responseParameters: {
      'method.response.header.Access-Control-Allow-Origin': "'*'",
      'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
      'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'"
    }
  };

// Create the OPTIONS method to handle CORS preflight requests
  tokenId.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [optionsResponse],
    passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: { "application/json": "{\"statusCode\": 200}" }
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
      },
    }],
  });

  // Create the /delivery resource
  const lite = api.root.addResource('lite');
  const deliver_nft = lite.addResource('deliver_nft');
  const contractAddressDelivery = deliver_nft.addResource('{contractAddress}');
  const tokenIdDelivery = contractAddressDelivery.addResource('{tokenId}');

  // Define the mapping template to decode the Base64-encoded body
  const deliveryRequestTemplate = `{
    "contractAddress": "$input.params('contractAddress')",
    "tokenId": "$input.params('tokenId')",
    "mode": $input.json('$.mode'),
    "buyerWalletAddress": $input.json('$.buyerWalletAddress'),
    "priceCurrencyCode": $input.json('$.priceCurrencyCode'),
    "price": $input.json('$.price'),
    "quantity": $input.json('$.quantity'),
    "sellerWalletAddress": $input.json('$.sellerWalletAddress'),
    "listingId": $input.json('$.listingId')
  }`;

  const deliveryIntegrationResponses =  [
    {
      statusCode: "200",
      responseTemplates: {
        "application/json": `#set($inputRoot = $input.path('$'))
          {
            "transactionId": "$inputRoot.transactionId"
          }`
      }
    }
  ]

  // Create a Lambda integration with the mapping template
  const deliveryLambdaIntegration = new apigateway.LambdaIntegration(deliveryLambda, {
    proxy: false, // Use custom integration to apply the mapping template
    requestTemplates: {
      'application/json': deliveryRequestTemplate,
    },
    integrationResponses: deliveryIntegrationResponses
  });

  // Add POST method to /delivery resource
  tokenIdDelivery.addMethod('POST', deliveryLambdaIntegration, {
    methodResponses: [
      { statusCode: '200' ,responseModels: { "application/json": apigateway.Model.EMPTY_MODEL}},
    ],
  });

// Create the OPTIONS method to handle CORS preflight requests
  tokenIdDelivery.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [optionsResponse],
    passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: { "application/json": "{\"statusCode\": 200}" }
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
      },
    }],
  });

  // Create the /transaction_status resource
  const transaction_status = api.root.addResource('transaction_status');

  // Define the mapping template to decode the Base64-encoded body
  const statusRequestTemplate = `{
  "id": "$input.params('id')",
  "contractAddress": "$input.params('contractAddress')",
  "tokenId": "$input.params('tokenId')"
}`;

  const statusIntegrationResponses =  [
    {
      statusCode: "200",
      responseTemplates: {
        "application/json": ``
      }
    }
  ]

  const transactionStatusIntegration= new apigateway.LambdaIntegration(transactionStatusLambda, {
    proxy:false,
    requestTemplates: {
      'application/json': statusRequestTemplate,
    },
    integrationResponses: statusIntegrationResponses
  });

  // Add GET method to /transaction_status resource
  transaction_status.addMethod('GET', transactionStatusIntegration, {
    methodResponses: [
      { statusCode: '200' ,responseModels: { "application/json": apigateway.Model.EMPTY_MODEL}},
    ],
  });

  // Create the OPTIONS method to handle CORS preflight requests
  transaction_status.addMethod('OPTIONS', new apigateway.MockIntegration({
    integrationResponses: [optionsResponse],
    passthroughBehavior: apigateway.PassthroughBehavior.WHEN_NO_MATCH,
    requestTemplates: { "application/json": "{\"statusCode\": 200}" }
  }), {
    methodResponses: [{
      statusCode: '200',
      responseParameters: {
        'method.response.header.Access-Control-Allow-Origin': true,
        'method.response.header.Access-Control-Allow-Headers': true,
        'method.response.header.Access-Control-Allow-Methods': true,
      },
    }],
  });

  return api;
};
