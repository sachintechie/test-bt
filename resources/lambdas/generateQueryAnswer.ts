import * as AWS from "aws-sdk";
import * as uuid from "uuid";
import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { BedrockAgentRuntimeClient, RetrieveAndGenerateCommand, RetrieveAndGenerateType } from "@aws-sdk/client-bedrock-agent-runtime";
import { getProjectById } from "../db/adminDbFunctions";

const TABLE_NAME = "aws-abu-dhabi-dynamodb";
const SECRET_NAME = process.env.SECRET_NAME as string;

const dynamodb = new AWS.DynamoDB({ region: "us-east-1" });
const secretsManager = new SecretsManager({ region: "us-east-1" });

// Function to generate job ID
function generateJobId(length: number = 10): string {
  return uuid.v4().replace(/-/g, "").substring(0, length);
}

// Lambda handler function
export const handler = async (event: any, context: any) => {
  const jobId = generateJobId();
  const sourceText: string[] = [""];
  const sourceFilenamelist: string[] = [""];
  let finalAnswer = "";
  let i = 1;

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
    const userMessage = event.body.message;
    const projectId = event.body.projectId;
    let sessionId = event.body.sessionId || `initial${uuid.v4()}`;

    console.log(`User message: ${userMessage}`);
    console.log(`Session ID: ${sessionId}`);
    console.log(`Project ID: ${projectId}`);


    // get the project from the database using projectId
    const project = await getProjectById(projectId);

    console.log("Project fetched successfully...");

    // from project we will get the knowledge base id, and index name
    const indexId = project.data?.indexid;
    const knowledgebaseId = project.data?.knowledgebaseid;

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
        knowledgeBaseId: knowledgebaseId ? knowledgebaseId : "ET3BO7O02P", // Your knowledge base ID
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

    // // Extracting and formatting text and citations
    // if (response?.citations) {
    //     console.log("Processing citations...");

    //     // Loop through the citations
    //     for (const citation of response.citations) {
    //         if (citation) {
    //             const responseText = citation?.generatedResponsePart?.textResponsePart?.text;
    //             finalAnswer += responseText + " ";

    //             if (citation?.retrievedReferences) {
    //                 for (const reference of citation?.retrievedReferences) {
    //                     // Extract and format the citations
    //                     const sourceUrl = reference?.content?.text;
    //                     const sourceFilename = reference?.metadata ? reference?.metadata['x-amz-bedrock-kb-source-uri'] : "";

    //                     // Append the source filename and reference text to the lists
    //                     sourceFilenamelist.push(sourceFilename?.toString() ?? "");
    //                     sourceText.push(`${sourceUrl}\n`);

    //                     // Add source reference text to final answer
    //                     finalAnswer += `Source[${i}] `;
    //                     i++;
    //                 }
    //             }
    //             finalAnswer += `\n`;
    //         }
    //     }
    // }

    // Extracting and formatting text and citations
    if (response?.citations?.length) {
      console.log("Processing citations...");
      for (const citation of response.citations) {
        if (citation) {
          const responseText = citation?.generatedResponsePart?.textResponsePart?.text || "";
          finalAnswer += responseText + " ";

          if (citation?.retrievedReferences?.length) {
            for (const reference of citation?.retrievedReferences) {
              const sourceUrl = reference?.content?.text || "";
              const sourceFilename = reference?.metadata?.["x-amz-bedrock-kb-source-uri"] || "";

             // sourceFilenamelist.push(sourceFilename);
              if (typeof sourceFilename === 'string') {
                sourceFilenamelist.push(sourceFilename);
            } else {
                console.warn("sourceFilename is not a string:", sourceFilename);
            }
              sourceText.push(`${sourceUrl}\n`);
              finalAnswer += `Source[${i}] `;
              i++;
            }
          }
          finalAnswer += `\n`;
        }
      }
    }

    // If no citations or generated response part, fallback to `output.text`
    if (!finalAnswer.trim() && response?.output?.text) {
      console.log("Using fallback output text...");
      finalAnswer = response.output.text;
    }

    console.log("Final generated answer:", finalAnswer);

    console.log("Final generated answer:", finalAnswer);

    // Storing result in DynamoDB
    console.log("Storing result in DynamoDB...");
    await dynamodb
      .putItem({
        TableName: TABLE_NAME,
        Item: {
          job_id: { S: jobId },
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
          status: { S: "ERROR" },
          response: { S: "Something went wrong" },
          user_query: { S: "General query" },
          session_id: { S: "N/A" },
          source_text: { L: sourceText.map((text) => ({ S: text })) }
        }
      })
      .promise();
    console.log("Error stored in DynamoDB.");

    // Returning error response
    return {
        job_id: jobId,
        message: "Something went wrong",
        sessionId: "N/A",
        source_text: sourceText
      };
  }
};
