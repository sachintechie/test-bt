import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { env, envConfig, isDevOrProd, isOnDemandProd, isPlaygroundDev } from "./utils/env";
import { configResolver, newAppSyncApi } from "./utils/appsync";
import { capitalize, readFilesFromFolder } from "./utils/utils";
import { newApiGateway, newStripeWebhookApiGateway } from "./utils/apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DatabaseInfo, getDatabaseInfo, getDevOrProdDatabaseInfo, getOnDemandProdDatabaseInfo, getPlaygrounDevDatabaseInfo } from "./utils/aurora";
import { AuroraStack } from "./bridgetower-aurora-stack";
import { newMigrateNodeJsFunction, newNodeJsFunction } from "./utils/lambda";
import * as cr from "aws-cdk-lib/custom-resources";
import * as fs from "fs";
import * as path from "path";

const EXCLUDED_LAMBDAS_IN_APPSYNC = [
  "apigatewayAuthorizer",
  "adminAppsyncAuthorizer",
  "appsyncAuthorizer",
  "checkAndTransferBonus",
  "checkTransactionStatusAndUpdate",
  "createKycApplicant",
  "deleteKeyAndUserFromCubistAndDB",
  "migrateDB",
  "createOrganizationUnitAndAwsAccount",
  "moonpayNftLiteAsset",
  "moonpayNftLiteDelivery",
  "moonpayNftLiteStatus",
  "postStripePaymentIntentWebhook",
  "checkAndUpdateProjects",
];

const GET_METADATA = "getMetadata";
const MIGRATION_LAMBDA_NAME = "migrateDB";
const POST_STRIPE_PAYMENT_INTENT_WEBHOOK = "postStripePaymentIntentWebhook";

const MUTATIONS = [
  "createCategory",
  "createProduct",
  "createProductAttribute",
  "createWallet",
  "unstaking",
  "mergeStake",
  "withdrawStake",
  "batchMintCnft",
  "adminTransfer",
  "addToWishlist",
  "removeFromWishlist",
  "createOrder",
  "createTokenAccount",
  "updateOrderStatus",
  "updateCategory",
  "updateProduct",
  "updateProductAttribute",
  "addSubAdmin",
  "addReview",
  "createCollection",
  "addProductToCollection",
  "removeProductFromCollection",
  "storeHash",
  "updateProductStatus",
  "deleteProduct",
  "addRefToKnowledgeBase",
  "storeHashOnSubnet",
  "createInventory",
  "updateInventory",
  "bulkImportInventory",
  "bulkImportProduct",
  "deleteInventory",
  "manageProductMedia",
  "deleteRefToKnowledgeBase",
  "createProject",
  "addReference",
  "addProjectAndReference"
];


interface AppSyncStackProps extends cdk.StackProps {
  lambdaFolder: string;
  sharedLambdaFolder: string; 
  schemaFile: string;
  name: string;
  authorizerLambda: string;
  hasApiGateway?: boolean;
  apiName: string;
  needMigrate?: boolean;
  auroraStack?: AuroraStack;
}

export class BridgeTowerAppSyncStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppSyncStackProps) {
    super(scope, id, props);

    const lambdaMap = new Map<string, lambda.Function>();

    let databaseInfo: DatabaseInfo;
    if (isOnDemandProd()) {
      databaseInfo = getOnDemandProdDatabaseInfo(this);
    }
    else if (isPlaygroundDev()) {
      databaseInfo = getPlaygrounDevDatabaseInfo(this);
    }
    else if (!isDevOrProd()) {
      databaseInfo = getDatabaseInfo(this, props.auroraStack!);
    }
    else {
      databaseInfo = getDevOrProdDatabaseInfo(this);
    }
    console.log(databaseInfo);

    const loadSchemas = (...schemaFiles: string[]): string => {
      return schemaFiles
        .map(file => fs.readFileSync(path.resolve(process.cwd(), file), "utf8"))
        .join("\n");
    };

    const combinedSchema = loadSchemas("shared_schema.graphql", `graphql/${props.schemaFile}`);

    const api = newAppSyncApi(this, env`${props.apiName}`, props.name, lambdaMap, combinedSchema, props.authorizerLambda);

    const lambdaResourceNames = readFilesFromFolder(props.lambdaFolder);

    for (const lambdaResourceName of lambdaResourceNames) {
      const lambdaFunction = lambdaResourceName === MIGRATION_LAMBDA_NAME
      ? newMigrateNodeJsFunction(this, lambdaResourceName, `${props.lambdaFolder}/${lambdaResourceName}.ts`, databaseInfo)
      : newNodeJsFunction(this, lambdaResourceName, `${props.lambdaFolder}/${lambdaResourceName}.ts`, databaseInfo);
    lambdaMap.set(lambdaResourceName, lambdaFunction);
    }

    const sharedLambdaResourceNames = readFilesFromFolder(props.sharedLambdaFolder);
    for (const lambdaResourceName of sharedLambdaResourceNames) {
      if (!EXCLUDED_LAMBDAS_IN_APPSYNC.includes(lambdaResourceName)) {
        lambdaMap.set(
          lambdaResourceName,
          newNodeJsFunction(this, lambdaResourceName, `${props.sharedLambdaFolder}/${lambdaResourceName}.ts`, databaseInfo)
        );
      }
    }

    if (!isDevOrProd() && props.needMigrate) {
      // Create a custom resource to trigger the migration Lambda function
      const provider = new cr.Provider(this, env`MigrateProvider`, {
        onEventHandler: lambdaMap.get(MIGRATION_LAMBDA_NAME)!
      });

      new cdk.CustomResource(this, env`MigrateResource`, { serviceToken: provider.serviceToken, properties: { version: "0.0.6" } });
    }

    if (props.hasApiGateway) {
      const gateway = newApiGateway(this, lambdaMap.get(GET_METADATA)!);
      const stripeWebhookGateway = newStripeWebhookApiGateway(this, lambdaMap.get(POST_STRIPE_PAYMENT_INTENT_WEBHOOK)!);
    }

    // // Create a new AppSync GraphQL API
    // const api = newAppSyncApi(this, env`${props.apiName}`, props.name, lambdaMap, props.schemaFile, props.authorizerLambda);


    // Create resolvers for each lambda function
    for (const [key, value] of lambdaMap) {
      if (!EXCLUDED_LAMBDAS_IN_APPSYNC.includes(key)) {
        configResolver(api, value, MUTATIONS.includes(key) ? "Mutation" : "Query", capitalize(key));
      }
    }

    new cdk.CfnOutput(this, env`${props.name}URL`, {
      value: api.graphqlUrl
    });

    new cdk.CfnOutput(this, env`${props.name}Key`, {
      value: api.apiKey || ""
    });
  }
}
