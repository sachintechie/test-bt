import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, RetrieveAndGenerateType } from "@aws-sdk/client-bedrock-agent-runtime";
import { getProjectById } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME ?? "";
const SECRET_NAME = process.env.SECRET_NAME as string;

const dynamodb = new AWS.DynamoDB({ region: "us-east-1" });
const secretsManager = new SecretsManager({ region: "us-east-1" });

// Function to generate job ID
function generateJobId(length: number = 10): string {
  return uuid.v4().replace(/-/g, "").substring(0, length);
}

// Lambda handler function
export const handler = async (event: any, context: any) => {
  const tenant = event.identity.resolverContext as tenant;

  const customerId = tenant?.customerid == null ? tenant?.adminuserid :tenant?.customerid;
  const projectId = event.arguments?.input?.projectId;
  const jobId = generateJobId();
  let sessionId = event.arguments?.input?.sessionId || `initial${uuid.v4()}`;

  const sourceText: string[] = [];
  const sourceFilenamelist: string[] = [];
  let finalAnswer = "";

  try {
    console.log("Starting Lambda execution...");

    // Fetching secrets from AWS Secrets Manager
    console.log("Fetching secrets...");
    const getSecretValueResponse = await secretsManager.getSecretValue({ SecretId: SECRET_NAME });
    const secrets = JSON.parse(getSecretValueResponse.SecretString!);
    console.log("Secrets fetched successfully...");

    // Initialize the Bedrock agent client
    const client = new BedrockAgentRuntimeClient({ region: "us-east-1" });

    // Parse the input from the event
    console.log("Parsing input from event...");
    console.log("Event:", event);
    console.log("Event arguments Input :", event.arguments?.input);
    const userMessage = event.arguments?.input?.message;


    console.log(`User message: ${userMessage}`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Project ID: ${projectId}`);

    // get the project from the database using projectId
    const project = await getProjectById(projectId);

    console.log("Project fetched successfully...");

    // from project we will get the knowledge base id, and index name
    //const indexId = project.data?.indexid;
    const knowledgebaseId = project.data?.knowledgebaseid ? project.data?.knowledgebaseid : "ET3BO7O02P";
    console.log("knowledgebaseId", knowledgebaseId);
    // Set up the configuration for retrieval and generation
    const numberOfResults = 10;
    const promptTemplate = `
        Human: You are an AI chatbot designed to answer questions about doing business in Abu Dhabi. I will provide you with a set of search results and a user's question. Use the provided search results as your reference to ensure accurate and relevant responses. Always respond in a friendly and conversational manner. Only to answer question like greetings, you can answer in professional manner using your knowledge and ignore the search results. In all other cases, If you don't find anything relevant about question in given search results then state Sorry, I don't have enough information in my database to answer this question.

        Here are the search results in numbered order:
        $search_results$

        Here is the user's question:
        <question>
        $query$
        </question>

        $output_format_instructions$

        Response:
        Based on the information retrieved from the sources, here’s the answer to your query:
    `;
    const retrieveAndGenerateConfiguration = {
      knowledgeBaseConfiguration: {
        knowledgeBaseId: knowledgebaseId, // Your knowledge base ID
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

    // Input data for retrieval and generation
    const inputData = { text: userMessage };

    console.log("Sending request to Bedrock Agent...");
    let response;
    if (sessionId.includes("initial")) {
      response = await client.send(
        new RetrieveAndGenerateCommand({
          input: inputData,
          retrieveAndGenerateConfiguration
        })
      );
    } else {
      response = await client.send(
        new RetrieveAndGenerateCommand({
          input: inputData,
          retrieveAndGenerateConfiguration,
          sessionId
        })
      );
    }

    // Processing response from Bedrock agent
    console.log("Bedrock agent response:", response);
    sessionId = response.sessionId;

    // Extracting and formatting text and citations
    if (response?.citations) {
      console.log("Processing citations...");
    
      let i = 1; // Initialize i
      for (const citation of response.citations) {
        if (citation) {
          const responseText = citation?.generatedResponsePart?.textResponsePart?.text;
          console.log("Response text:", responseText);
          finalAnswer += responseText + " ";
    
          if (citation?.retrievedReferences) {
            for (const reference of citation.retrievedReferences) {
              console.log("Reference:", reference);
              const sourceUrl = reference?.content?.text;
              const sourceFilename = reference?.metadata ? reference?.metadata["x-amz-bedrock-kb-source-uri"] : "";
    
              // Log for debugging
              console.log("Source URL:", sourceUrl);
              console.log("Source Filename:", sourceFilename);
    
              // Append to lists
              sourceFilenamelist.push(sourceFilename?.toString() ?? "");
              sourceText.push(`${sourceUrl}\n`);
    
              // Add to finalAnswer
              finalAnswer += `Source[${i}] `;
              i++;
            }
          } else {
            console.log("No retrievedReferences for this citation.");
          }
          finalAnswer += `\n`;
        }
      }
    }

    // Log for debugging
    console.log("Final generated answer:", finalAnswer);

    // Storing result in DynamoDB
    console.log("Storing result in DynamoDB...");
    await dynamodb
      .putItem({
        TableName: TABLE_NAME,
        Item: {
          job_id: { S: jobId },
          customer_id: { S: customerId },
          project_id: { S: projectId },
          status: { S: "PENDING" },
          response: { S: finalAnswer },
          user_query: { S: userMessage },
          session_id: { S: sessionId },
          source_text: { L: sourceText.map((text) => ({ S: text })) },
          source_filenamelist: { L: sourceFilenamelist.map((filename) => ({ S: filename })) }
        }
      })
      .promise();
    console.log("Result stored in DynamoDB.");

    // Returning the response to the client
    return {
      job_id: jobId,
      message: response.output?.text,
      sessionId,
      source_text: sourceText,
      source_filenamelist: sourceFilenamelist
    };
  } catch (error) {
    console.error("Error during Lambda execution:", error);

    // Storing error details in DynamoDB
    await dynamodb
      .putItem({
        TableName: TABLE_NAME,
        Item: {
          job_id: { S: jobId },
          customer_id: { S: customerId || "NA" },
          project_id: { S: projectId },
          status: { S: "ERROR" },
          response: { S: "Something went wrong" },
          user_query: { S: "General query" },
          session_id: { S: sessionId },
          source_text: { L: sourceText.map((text) => ({ S: text })) }
        }
      })
      .promise();
    console.log("Error stored in DynamoDB.");

    // Returning error response
    return {
      job_id: jobId,
      message: "Something went wrong",
      sessionId: sessionId,
      source_text: sourceText,
      source_filenamelist: sourceFilenamelist
    };
  }
};
