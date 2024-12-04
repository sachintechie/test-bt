import { Client as OpenSearchClient } from '@opensearch-project/opensearch';
import { fromTemporaryCredentials } from '@aws-sdk/credential-providers'; // Correct package
import * as aws4 from 'aws4';
import AWS from 'aws-sdk';
import axios from 'axios';
// Lambda handler function
export const indexing = async (all_embeddings_with_metadata : any) => {
  const documents: any[] = all_embeddings_with_metadata;

  // Check if event is a list; if so, treat it as the documents list directly
//   if (Array.isArray(event.body)) {
//     documents = JSON.parse(event.body);
//   } else {
//     // If event is a dictionary, attempt to access 'all_embeddings_with_metadata' key
//     const body = JSON.parse(event.body || '{}');
//     documents = body.all_embeddings_with_metadata || [];
//   }

  const indexName = process.env.INDEX_NAME || 'sagemaker-index-1';

  // Connect to OpenSearch and index documents
  const { client, host } = await connectOpenSearch();
  const filenamesList = await indexDocuments(client, indexName, documents);
  return filenamesList;
  
  
};



  const connectOpenSearch = async () => {
    const region = 'us-east-1';  // Change as needed
    const service = 'es';  // OpenSearch uses 'es' service
  
    const host = "gkl444a9g3cghs48thd8.us-east-1.aoss.amazonaws.com"
   


    
// Get AWS credentials from the default session
const credentials = new AWS.Credentials(
    process.env.AWS_ACCESS_KEY_ID??"",  // Can be from environment variables or explicitly set
    process.env.AWS_SECRET_ACCESS_KEY??"",
    process.env.AWS_SESSION_TOKEN // If you're using temporary credentials
  );
  // Configure AWS Signature V4 authentication
const awsAuth = {
    credentials,  // Provide AWS credentials directly
    region,
    service,
    host,          // OpenSearch endpoint URL
    method: 'GET',  // HTTP method (can change based on your use case)
  };
 
  // Create the AWS authentication object using aws4
  // Configure the AWS SigV4 signer
const signedRequest = aws4.sign({
    host: host,
    path: '/',  // Path for the OpenSearch request (adjust as needed)
    service: service,
    region: region,
    method: 'GET',  // HTTP method (GET, POST, etc.)
    headers: {
      'Content-Type': 'application/json',
    }
  }, {
    accessKeyId: credentials.accessKeyId!,
    secretAccessKey: credentials.secretAccessKey!,
    sessionToken: credentials.sessionToken // Include sessionToken if using temporary credentials
  });

      const client = new OpenSearchClient({
        node: host,
        // auth: {
        //   username: 'your-username',
        //   password: 'your-password',
        // },
        auth: {
            credentials,  // Pass AWS credentials
            region,       // AWS region
            service     // AWS service ('es' for OpenSearch)
          },
          headers: signedRequest.headers, // Pass the signed headers to the OpenSearch request
        ssl: {
          rejectUnauthorized: false, // Allow unverified SSL connections, change based on your needs
        },
        maxRetries: 5,
        requestTimeout: 10000, // 10 seconds
        sniffInterval: false, // Disable sniffing
        pingTimeout: 5000, // 5 seconds for ping timeout
        
      
        enableLongNumeralSupport: true, // Enables support for long numerals
      });
      
      
 
    return { client, host };
  };





interface Document {
    file_name: string;
    project_id: string;
    chunk_index: number;
    embedding: any;
    chunk_content: string;
  }
  

  interface Document {
    file_name: string;
    project_id: string;
    chunk_index: number;
    embedding: any;
    chunk_content: string;
  }
  
  async function indexDocuments(client: OpenSearchClient, indexName: string, documents: Document[]): Promise<string[]> {
    try{
    const filenames: string[] = [];
  
    for (const doc of documents) {
      const chunIndexValue = {
        id: "",
        embedding: doc.embedding,
        "x-amz-bedrock-kb-source-uri": JSON.stringify({
          file_name: doc.file_name,
          project_id: doc.project_id,
        }),
        metadata: JSON.stringify({
          chunk_index: doc.chunk_index,
        }),
        "x-amz-bedrock-kb-data-source-id": "",
        chunk_content: doc.chunk_content,
      };
  
      try {
        const response = await client.index({
          index: indexName,
          body: chunIndexValue,
        });
  
        filenames.push(doc.file_name);
  
        if (response.body.result === 'created') {
        //  console.log(`Document indexed: ${doc.file_name}`);
        } else {
          console.log(`Failed to index document: ${doc.file_name}, Response: ${JSON.stringify(response.body)}`);
        }
      } catch (error) {
        console.error(`Error indexing document: ${doc.file_name}, Error: ${error}`);
      }
    }
  
    const uniqueFilenames = Array.from(new Set(filenames));
    console.log(uniqueFilenames);
    return uniqueFilenames;
} catch (error) {
    console.error(`Error indexing document: ${error}`);
    return [];
}
  }
  
