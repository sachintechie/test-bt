import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, RetrieveAndGenerateType} from "@aws-sdk/client-bedrock-agent-runtime";
import { connectToOpenSearch } from '../opensearch/commonFunction';

const TABLE_NAME = 'aws-abu-dhabi-dynamodb';
const SECRET_NAME = process.env.SECRET_NAME as string;

const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });
const secretsManager = new SecretsManager({ region: 'us-east-1' });


// // Function to connect to OpenSearch
// async function connectToOpenSearch() {
//     try {
//         console.log("Initializing OpenSearch client...");
//         const client = new Client({
//             ...AwsSigv4Signer({
//                 region: 'us-east-1',
//                 service: 'aoss',
//                 getCredentials: () => {
//                     const credentialProvider = defaultProvider();
//                     return credentialProvider();
//                 },
//             }),
//             node: "https://bn7vivdz1pxj6w22xo5j.us-east-1.aoss.amazonaws.com", // Use your OpenSearch endpoint
//         });

//         console.log("Successfully connected to OpenSearch.");
//         return client;
//     } catch (error) {
//         console.error("Error connecting to OpenSearch:", error);
//         throw new Error('Failed to connect to OpenSearch');
//     }
// }

async function queryOpensearchCollection() {
    const client = await connectToOpenSearch();
    console.log("OpenSearch Connection Successful...");

    const query = { query: { match_all: {} } };
    const index = 'bedrock-knowledge-base-default-index';

    const response = await client.search({ body: query, index });
    console.log("Query_opensearch", response);
    
    return response;
}

function generateJobId(length: number = 10): string {
    return uuid.v4().replace(/-/g, '').substring(0, length);
}

export const handler = async (event: any, context: any) => {
    const jobId = generateJobId();
    const sourceText: string[] = [""];

    try {
        const getSecretValueResponse = await secretsManager.getSecretValue({ SecretId: SECRET_NAME });
        const secrets = JSON.parse(getSecretValueResponse.SecretString!);

        const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

        // Establish PostgreSQL connection using secrets
        const { Client } = require('pg');
        const pgClient = new Client({
            host: secrets.host,
            user: secrets.username,
            password: secrets.password,
            database: secrets.dbname,
            port: secrets.port,
        });

        await pgClient.connect();
        console.log("Database Connection successful...");

        const res = await pgClient.query("SELECT * FROM reference WHERE name = 'test';");
        console.log(res.rows);

        // Parse the input from the event
        const body = JSON.parse(event.body);
        const userMessage = body.message;
        let sessionId = body.sessionId || `initial${uuid.v4()}`;

        const numberOfResults = 10;
        const promptTemplate = `
            Here is some relevant information based on your query: $search_results$
            Please proceed with generating a response based on this information.
        `;
        const retrieveAndGenerateConfiguration = {
            knowledgeBaseConfiguration: {
                knowledgeBaseId: "X3RMAORSFE",
                modelArn: "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
                retrievalConfiguration: {
                    vectorSearchConfiguration: {
                        numberOfResults
                    }
                },
                generationConfiguration: {
                    promptTemplate: {
                        textPromptTemplate: promptTemplate
                    }
                }
            },
            type: RetrieveAndGenerateType.KNOWLEDGE_BASE
        };

        const inputData = { text: userMessage };

        let response;
        if (sessionId.includes('initial')) {
            response = await client.send(new RetrieveAndGenerateCommand({
                input: inputData,
                retrieveAndGenerateConfiguration,
            }));
        } else {
            response = await client.send(new RetrieveAndGenerateCommand({
                input: inputData,
                retrieveAndGenerateConfiguration,
                sessionId,
            }));
        }

        sessionId = response.sessionId;

        let finalAnswer = '';
        response?.citations?.forEach((citation: any) => {
            const responseText = citation.generatedResponsePart.textResponsePart.text;
            finalAnswer += responseText + " ";
        });

        dynamodb.putItem({
            TableName: TABLE_NAME,
            Item: {
                job_id: { S: jobId },
                status: { S: 'PENDING' },
                response: { S: finalAnswer },
                user_query: { S: userMessage },
                session_id: { S: sessionId },
                source_text: { L: sourceText.map((text) => ({ S: text })) }
            }
        });

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job_id: jobId, message: finalAnswer, sessionId, source_text: sourceText })
        };
    } catch (error) {
        console.error("Error:", error);
        dynamodb.putItem({
            TableName: TABLE_NAME,
            Item: {
                job_id: { S: jobId },
                status: { S: 'ERROR' },
                response: { S: 'Something went wrong' },
                user_query: { S: 'General query' },
                session_id: { S: 'N/A' },
                source_text: { L: sourceText.map((text) => ({ S: text })) }
            }
        });

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job_id: jobId, message: 'Something went wrong', sessionId: 'N/A', source_text: sourceText })
        };
    }
};
