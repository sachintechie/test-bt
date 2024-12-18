import { Client as OpenSearchClient } from "@opensearch-project/opensearch";
// import * as aws4 from 'aws4';
import AWS from "aws-sdk";
import { BedrockAgentClient, DeleteKnowledgeBaseCommand, ListKnowledgeBasesCommand } from "@aws-sdk/client-bedrock-agent";
import { connectToOpenSearch } from "../opensearch/commonFunction";

AWS.config.update({ region: "us-east-1" });

export class IndexS3Deletion {
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
    console.log(`[INIT] IndexS3Deletion initialized with projectName: ${projectName}, projectId: ${projectId}`);
  }

  // Function to delete S3 bucket
  async deleteS3Bucket(bucketName: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_S3_BUCKET] Attempting to delete bucket: ${bucketName}`);
    try {
      const params = {
        Bucket: bucketName
      };
      await this.s3.deleteBucket(params).promise();
      console.log(`[DELETE_S3_BUCKET] Bucket ${bucketName} deleted successfully`);
      return {
        success: true,
        message: `Bucket ${bucketName} deleted successfully`
      };
    } catch (error) {
      console.error(`[DELETE_S3_BUCKET] Error deleting bucket ${bucketName}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Function to delete OpenSearch index
  async deleteOpenSearchIndex(indexName: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_OPENSEARCH_INDEX] Attempting to delete index: ${indexName}`);
    try {
      this.openSearchClient = await connectToOpenSearch();
      const response = await this.openSearchClient.indices.delete({ index: indexName });

      if (response.statusCode === 200) {
        console.log(`[DELETE_OPENSEARCH_INDEX] Index ${indexName} deleted successfully`);
        return {
          success: true,
          message: `Index ${indexName} deleted successfully`
        };
      }

      console.error(`[DELETE_OPENSEARCH_INDEX] Failed to delete index ${indexName}`);
      return {
        success: false,
        message: `Failed to delete index ${indexName}`
      };
    } catch (error) {
      console.error(`[DELETE_OPENSEARCH_INDEX] Error deleting index ${indexName}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Function to delete KnowledgeBase
  async deleteKnowledgeBase(name: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_KNOWLEDGEBASE] Attempting to delete KnowledgeBase: ${name}`);
    try {
      const knowledgeBasesList = await this.bedrockAgentRuntimeClient.send(new ListKnowledgeBasesCommand({}));
      const list = knowledgeBasesList.knowledgeBaseSummaries || [];
      const knowledgeBase = list.find((kb) => kb.name === name);

      if (!knowledgeBase) {
        console.error(`[DELETE_KNOWLEDGEBASE] KnowledgeBase ${name} not found`);
        return {
          success: false,
          message: `KnowledgeBase ${name} not found`
        };
      }

      const command = new DeleteKnowledgeBaseCommand({ knowledgeBaseId: knowledgeBase.knowledgeBaseId });
      await this.bedrockAgentRuntimeClient.send(command);
      console.log(`[DELETE_KNOWLEDGEBASE] KnowledgeBase ${knowledgeBase.knowledgeBaseId} deleted successfully`);
      return {
        success: true,
        message: `KnowledgeBase ${knowledgeBase.knowledgeBaseId} deleted successfully`
      };
    } catch (error) {
      console.error(`[DELETE_KNOWLEDGEBASE] Error deleting KnowledgeBase ${name}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Function to delete files from index
  async deleteFilesFromOpenSearchIndex(indexName: string, fileName: string): Promise<{ success: boolean; message: string }> {
    console.log(`[DELETE_FILES_INDEX] Attempting to delete files with name: ${fileName} from index: ${indexName}`);
    try {
      this.openSearchClient = await connectToOpenSearch();
      const response = await this.openSearchClient.deleteByQuery({
        index: indexName,
        body: {
          query: {
            match: {
              "x-amz-bedrock-kb-source-uri": fileName
            }
          },
          size: 50
        }
      });

      if (response.statusCode === 200) {
        console.log(`[DELETE_FILES_INDEX] Files deleted from index ${indexName} successfully`);
        return {
          success: true,
          message: `Files deleted from index ${indexName} successfully`
        };
      }

      console.error(`[DELETE_FILES_INDEX] Failed to delete files from index ${indexName}`);
      return {
        success: false,
        message: `Failed to delete files from index ${indexName}`
      };
    } catch (error) {
      console.error(`[DELETE_FILES_INDEX] Error deleting files from index ${indexName}:`, error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}
