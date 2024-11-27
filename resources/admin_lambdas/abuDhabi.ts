import * as AWS from 'aws-sdk';
import * as uuid from 'uuid';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, RetrieveAndGenerateType } from "@aws-sdk/client-bedrock-agent-runtime";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

const TABLE_NAME = 'aws-abu-dhabi-dynamodb';
const SECRET_NAME = process.env.SECRET_NAME as string;

const dynamodb = new AWS.DynamoDB({ region: 'us-east-1' });
const secretsManager = new SecretsManager({ region: 'us-east-1' });


function generateJobId(length: number = 10): string {
    const jobId = uuid.v4().replace(/-/g, '').substring(0, length);
    console.log("Generated job ID:", jobId);
    return jobId;
}

export const handler = async (event: any, context: any) => {
    const jobId = generateJobId();
    const sourceText: string[] = [""];
    console.log("Lambda handler invoked with job ID:", jobId);

    try {
        // Fetch secrets
        console.log("Fetching secrets from Secrets Manager...");
        const getSecretValueResponse = await secretsManager.getSecretValue({ SecretId: SECRET_NAME });
        const secrets = JSON.parse(getSecretValueResponse.SecretString!);
        console.log("Successfully fetched secrets.");

        const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

        // Establish PostgreSQL connection using secrets
        console.log("Connecting to PostgreSQL database...");
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
        console.log("PostgreSQL Query Result:", res.rows);

        // Parse the input from the event
        console.log("Parsing event body...");
        const body = JSON.parse(event.body);
        const userMessage = body.message;
        let sessionId = body.sessionId || `initial${uuid.v4()}`;
        console.log("User message:", userMessage);
        console.log("Session ID:", sessionId);

        // Bedrock Configuration
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

        console.log("Sending request to Bedrock...");
        let response;
        if (sessionId.includes('initial')) {
            console.log("Session ID is initial. Sending request without session ID...");
            response = await client.send(new RetrieveAndGenerateCommand({
                input: inputData,
                retrieveAndGenerateConfiguration,
            }));
        } else {
            console.log("Session ID provided. Sending request with session ID...");
            response = await client.send(new RetrieveAndGenerateCommand({
                input: inputData,
                retrieveAndGenerateConfiguration,
                sessionId,
            }));
        }

        sessionId = response.sessionId;
        console.log("Response received from Bedrock. Session ID:", sessionId);

        // Process response
        let finalAnswer = '';
        response.citations.forEach((citation: any) => {
            const responseText = citation.generatedResponsePart.textResponsePart.text;
            finalAnswer += responseText + " ";
        });
        console.log("Final answer generated:", finalAnswer);

        // Store results in DynamoDB
        console.log("Storing results in DynamoDB...");
        await dynamodb.putItem({
            TableName: TABLE_NAME,
            Item: {
                job_id: { S: jobId },
                status: { S: 'PENDING' },
                response: { S: finalAnswer },
                user_query: { S: userMessage },
                session_id: { S: sessionId },
                source_text: { L: sourceText.map((text) => ({ S: text })) }
            }
        }).promise();

        console.log("Results stored successfully in DynamoDB.");

        // Return the response
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job_id: jobId, message: finalAnswer, sessionId, source_text: sourceText })
        };
    } catch (error) {
        console.error("Error during execution:", error);
        
        // Store error state in DynamoDB
        console.log("Storing error status in DynamoDB...");
        await dynamodb.putItem({
            TableName: TABLE_NAME,
            Item: {
                job_id: { S: jobId },
                status: { S: 'ERROR' },
                response: { S: 'Something went wrong' },
                user_query: { S: 'General query' },
                session_id: { S: 'N/A' },
                source_text: { L: sourceText.map((text) => ({ S: text })) }
            }
        }).promise();

        console.log("Error status stored in DynamoDB.");

        // Return the error response
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ job_id: jobId, message: 'Something went wrong', sessionId: 'N/A', source_text: sourceText })
        };
    }
};
