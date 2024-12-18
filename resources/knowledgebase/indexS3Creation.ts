import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
// import * as aws4 from 'aws4';
import AWS from "aws-sdk";
import { BedrockAgentClient, CreateKnowledgeBaseCommand } from "@aws-sdk/client-bedrock-agent";
import { connectToOpenSearch } from "../opensearch/commonFunction";

AWS.config.update({ region: "us-east-1" });

export class IndexS3Creation {
  s3: AWS.S3;
  private openSearchClient: OpenSearchClient;
  private projectName: string;
  private projectId: string;
  private bedrockAgentRuntimeClient: BedrockAgentClient;

  constructor(projectName: string, projectId: string) {
    this.projectName = projectName;
    this.projectId = projectId;
    this.s3 = new AWS.S3();
    this.bedrockAgentRuntimeClient = new BedrockAgentClient({ region: "us-east-1" });
  }
  //Function to validate S3 bucket name
  async validateS3BucketName(bucketName: string): Promise<{ isValid: boolean; message: string }> {
    if (bucketName.length < 3 || bucketName.length > 63) {
      return {
        isValid: false,
        message: "Bucket name should be between 3 and 63 characters long"
      };
    }

    if (bucketName.match(/[^a-z0-9.-]/)) {
      return {
        isValid: false,
        message: "Bucket name should contain only lowercase letters, numbers, hyphens, and periods"
      };
    }

    if (!/^[a-z0-9].*[a-z0-9]$/.test(bucketName)) {
      return { isValid: false, message: "Bucket name must start and end with a lowercase letter or number." };
    }

    if (bucketName.includes("..")) {
      return {
        isValid: false,
        message: "Bucket name should not contain consecutive periods"
      };
    }

    if (
      bucketName.includes(".-") ||
      bucketName.includes("-.") ||
      bucketName.startsWith(".") ||
      bucketName.startsWith("-") ||
      bucketName.endsWith(".") ||
      bucketName.endsWith("-")
    ) {
      return {
        isValid: false,
        message: "Bucket name should not start or end with hyphens or periods"
      };
    }

    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(bucketName)) {
      return {
        isValid: false,
        message: "Bucket name should not be formatted like an IP address"
      };
    }
    return {
      isValid: true,
      message: "Bucket name is valid"
    };
  }

  //Function to create S3 bucket
  async createS3Bucket(bucketName: string): Promise<string> {
    // check if bucket is valid
    const validation = await this.validateS3BucketName(bucketName);
    if (!validation.isValid) {
      throw new Error(validation.message);
    }
    // create s3 bucket
    const response = await this.s3
      .createBucket({
        Bucket: bucketName,
        ACL: "private"
      })
      .promise();

    this.s3.putPublicAccessBlock({
      Bucket: bucketName,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true
      }
    });
    // wait for some time to replicate policy to bucket
    await new Promise((resolve) => setTimeout(resolve, 5000));

    await this.addPolicyToS3Bucket(bucketName);

    // enable Block Public Access
    await this.s3
      .putPublicAccessBlock({
        Bucket: bucketName,
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          IgnorePublicAcls: true,
          BlockPublicPolicy: true,
          RestrictPublicBuckets: true
        }
      })
      .promise();

    await this.addCORSConfigurationToS3Bucket(bucketName);

    if (response.Location) {
      return `Bucket created successfully at ${response.Location}`;
    } else {
      throw new Error("Bucket creation failed");
    }
  }

  async addPolicyToS3Bucket(bucketName: string): Promise<string> {
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: "s3:PutObject",
          Resource: `arn:aws:s3:::${bucketName}/*`
        }
      ]
    };

    const params = {
      Bucket: bucketName,
      Policy: JSON.stringify(policy)
    };

    const response = await this.s3.putBucketPolicy(params).promise();

    if (response) {
      return "Policy added successfully";
    } else {
      throw new Error("Policy addition failed");
    }
  }

  async addCORSConfigurationToS3Bucket(bucketName: string): Promise<string> {
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["PUT", "POST"],
          AllowedOrigins: ["*"],
          ExposeHeaders: []
        }
      ]
    };

    const params = {
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration
    };

    const response = await this.s3.putBucketCors(params).promise();

    if (response) {
      return "CORS configuration added successfully";
    } else {
      throw new Error("CORS configuration addition failed");
    }
  }

  // Function to create Opensearch Index
  async createOpenSearchIndex(indexName: string): Promise<string> {
    this.openSearchClient = await connectToOpenSearch();
    const response = await this.openSearchClient.indices.create({
      index: indexName,
      body: {
        settings: {
          "index.knn": true,
          number_of_shards: 1,
          "knn.algo_param.ef_search": 512,
          number_of_replicas: 0
        },
        mappings: {
          properties: {
            [process.env.VECTOR_FIELD ?? ""]: {
              type: "knn_vector",
              dimension: 768,
              method: {
                name: "hnsw",
                engine: "faiss"
              }
            },
            text: { type: "text", index: true },
            metadata: { type: "text", index: false }
          }
        }
      }
    });

    if (response) {
      return "Index created successfully";
    } else {
      throw new Error("Index creation failed");
    }
  }

  async createKnowledgeBase(projectName: string): Promise<string> {
    const knowledgeBaseName = `${this.projectName}-kb`;
    this.bedrockAgentRuntimeClient
      .send(
        new CreateKnowledgeBaseCommand({
          name: knowledgeBaseName,
          roleArn: process.env.ROLE_ARN,
          storageConfiguration: {
            opensearchServerlessConfiguration: {
              collectionArn: process.env.COLLECTION_ARN,
              fieldMapping: {
                textField: "text",
                metadataField: "meta-data",
                vectorField: process.env.VECTOR_FIELD
              },
              vectorIndexName: projectName + "-index"
            },
            type: "OPENSEARCH_SERVERLESS"
          },
          description: `Knowledge base for project ${this.projectName}`,
          knowledgeBaseConfiguration: {
            type: "VECTOR",
            vectorKnowledgeBaseConfiguration: {
              embeddingModelArn: process.env.EMBEDDING_MODEL_ARN,
              embeddingModelConfiguration: {
                bedrockEmbeddingModelConfiguration: {
                  dimensions: 768
                }
              }
            }
          }
        })
      )
      .then((response) => {
        return response;
      });
    return "null";
  }
}
