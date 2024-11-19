import {
  createStage,
  createStep,
  createStepDetails,
  getStageDetails,
  getStageDetailsByProjectId,
  getStageType,
  getStepDetails,
  getStepType,
  updateProjectStage
} from "../db/adminDbFunctions";
import { hashing, storeHash } from "../avalanche/storeHashFunctions";
import { ProjectStage, ProjectStatusEnum } from "@prisma/client";
import { getS3Data, lambdaCallForCombineChunks, lambdaCallForIndexing } from "../knowledgebase/commonFunctions";
import axios from "axios";
import { EmbeddingMetadata, GroupedChunk, HashedEntry } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId } = event;

    // Calls function to handle adding stages and steps for file processing
    const data = await addStageAndSteps(tenantUserId, projectId);

    return {
      status: data ? 200 : 400,
      data: data,
      error: data
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return { status: 400, data: null, error: err };
  }
};

// Function to add stages and steps for processing files in multiple stages
export async function addStageAndSteps(tenantUserId: string, projectId: string) {
  try {
    let file_embeddings;
    // Stage 4: Data Preparation
    const stageType1 = await getStageType("Data Source");

    const stageType4 = await getStageType("Data Preparation");
    if (stageType4) {
      const stage4 = await createStage(tenantUserId, "Data Preparation", "Data Preparation", stageType4.id, projectId, 4);
      const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
      if (sourceStageDetails != null && sourceStageDetails?.steps.length > 0) {
        const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
        const stepDetails = await getStepDetails(fileUploadStepId);

      // Retrieve details from the previous ingestion stage
    //  const stepDetails = await getStageDetailsByProjectId(projectId);
      if (stepDetails != null && stepDetails.length > 0) {
        const [stepType1, stepType2, stepType3, stepType4, stepType5, stepType6, stepType7] = await Promise.all([
          getStepType("Chunking"),
          getStepType("Chunking hash"),
          getStepType("Embedding of chunks"),
          getStepType("Reconstruction of data"),
          getStepType("Store chunk hash to Blockchain"),
          getStepType("Hashing of reconstructive data"),
          getStepType("Store recombined file to Blockchain")
        ]);

        if (stepType1 && stepType2 && stepType3 && stepType4 && stepType5 && stepType6 && stepType7) {
          const [step1, step2, step3, step4, step5, step6, step7] = await Promise.all([
            createStep(tenantUserId, "Chunking", "Chunking", stepType1.id, stage4.id, 1),
            createStep(tenantUserId, "Chunking hash", "Chunking hash", stepType2.id, stage4.id, 2),
            createStep(tenantUserId, "Embedding of chunks", "Embedding of chunks", stepType3.id, stage4.id, 3),
            createStep(tenantUserId, "Reconstruction of data", "Reconstruction of data", stepType4.id, stage4.id, 1),
            createStep(tenantUserId, "Store chunk hash to Blockchain", "Store chunk hash to Blockchain", stepType5.id, stage4.id, 2),
            createStep(tenantUserId, "Hashing of reconstructive data", "Hashing of reconstructive data", stepType6.id, stage4.id, 3),
            createStep(
              tenantUserId,
              "Store recombined file to Blockchain",
              "Store recombined file to Blockchain",
              stepType7.id,
              stage4.id,
              1
            )
          ]);

          for (const stepDetail of stepDetails) {
            const data = JSON.parse(stepDetail.metadata);

            // Step 1 and step 3: Chunking and Embedding of chunks
            file_embeddings = await processFile(data.fileName, step1.id, step3.id, tenantUserId, projectId);
            let hashed_chunkcontent;
            if (file_embeddings.embeddings != null) {
              // Step 2: Chunking hash
              hashed_chunkcontent = await hashChunkContents(file_embeddings?.embeddings, step2.id, tenantUserId);
            }

            // Step 5: Store chunk hash to Blockchain

            if (hashed_chunkcontent != null) {
              const blockchainHashedData = await storeHash(hashed_chunkcontent[0].hash, false);
              await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step5.id);
            }

            // Step 4,6,7:Hashing of reconstructive data , Store recombined file to Blockchain ,Store recombined file to Blockchain

            const combined_response = await lambdaCallForCombineChunks(file_embeddings);

            const hashCombinedData = hashCombinedChunks(combined_response["body"], step4.id, step6.id, step7.id, tenantUserId);
          }

          // Update project to reflect data preparation status
          await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
        }
      }
    }
    }

    // Stage 5: Rag Ingestion
    const stageType5 = await getStageType("RAG Ingestion");
    if (stageType5) {
      const stage5 = await createStage(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);

      // Retrieve details from the previous ingestion stage
      const stepDetails = await getStageDetailsByProjectId(projectId);
      if (stepDetails != null && stepDetails.length > 0) {
        const [stepType1] = await Promise.all([getStepType("Writing to open search")]);

        if (stepType1) {
          const [step1] = await Promise.all([
            createStep(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1)
          ]);

          const lambdaResponseForIndexing = await lambdaCallForIndexing(file_embeddings);

          for (const indexedFile of lambdaResponseForIndexing) {
            const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
            await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id);
          }

          // Update project to reflect data preparation status
          await updateProjectStage(projectId, ProjectStage.RAG_INGESTION, ProjectStatusEnum.ACTIVE);
        }
      }
    }

    // Stage 5: Published
    const stageType6 = await getStageType("Published");
    if (stageType6) {
      const stage6 = await createStage(tenantUserId, "Published", "Published", stageType6.id, projectId, 6);

      // Update project to reflect data preparation status
      await updateProjectStage(projectId, ProjectStage.PUBLISHED, ProjectStatusEnum.ACTIVE);
    }

    return true;
  } catch (e) {
    console.error("Error in addStageAndSteps:", e);
    throw e;
  }
}

async function hashCombinedChunks(
  combinedResponseBody: string,
  step4Id: string,
  step6Id: string,
  step7Id: string,

  createdBy: string
) {
  const hashedData: Array<{ file_name: string; file_content_hash: string }> = [];

  // Parse the combined response body (assuming it's a JSON array)
  const combinedResponse: Array<any> = JSON.parse(combinedResponseBody);

  for (const entry of combinedResponse) {
    // Step detail for reconstruction of data

    const metadata4 = { file_name: entry["file_name"] };

    await createStepDetails(createdBy, JSON.stringify(metadata4), step4Id);

    // Hash the content
    const fileContent = entry["file_content"] || "";
    console.log("------------------------------------------------------------------------");
    console.log(fileContent); // Equivalent to your print statement

    // Base64 encode the file content
    const encodedBytes = Buffer.from(fileContent, "utf-8");
    const base64Content = encodedBytes.toString("base64");

    // Create the JSON response content
    const content = JSON.stringify({
      fileName: entry["file_name"],
      fileContent: base64Content
    });

    // Hash the content
    const fileContentHash = await hashing(content);

    // Prepare the hashed entry
    const hashedEntry = {
      file_name: entry["file_name"],
      file_content_hash: fileContentHash.data?.dataHash || ""
    };

    // Push the hashed entry to the result array
    hashedData.push(hashedEntry);

    await createStepDetails(createdBy, JSON.stringify(hashedEntry), step6Id);

    const combinedResponse = await storeHash(hashedEntry["file_content_hash"], false);

    await createStepDetails(createdBy, JSON.stringify(combinedResponse.data), step7Id);
  }

  return hashedData;
}

// Function to hash the chunk contents
async function hashChunkContents(allEmbeddingsWithMetadata: EmbeddingMetadata[], step1Id: string, createdBy: string) {
  const hashedData: HashedEntry[] = [];

  // Hash each chunk's content
  allEmbeddingsWithMetadata.forEach(async (entry) => {
    const chunkContent = entry.chunk_content || "";
    const chunkHash = await hashing(chunkContent);

    const hashedEntry: HashedEntry = {
      file_name: entry.file_name,
      chunk_index: entry.chunk_index,
      chunk_hash: chunkHash.data?.dataHash ?? "",
      project_id: entry.project_id
    };

    hashedData.push(hashedEntry);
  });

  // Group the hashed data by file_name
  const groupedChunks: Record<string, HashedEntry[]> = {};
  hashedData.forEach((chunk) => {
    if (!groupedChunks[chunk.file_name]) {
      groupedChunks[chunk.file_name] = [];
    }
    groupedChunks[chunk.file_name].push(chunk);
  });

  // Create the grouped chunk list and hash the chunk groups
  const groupedChunkList = Object.values(groupedChunks);
  const hashedChunkContent: GroupedChunk[] = [];

  groupedChunkList.forEach(async (group) => {
    const hashContent = await hashing(group);
    const fileName = group[0].file_name;

    hashedChunkContent.push({ file_name: fileName, hash: hashContent.data?.dataHash ?? "" });
    const metaData = { fileName, hash: hashContent };
    // Create a step detail for the chunk hashing process
    await createStepDetails(createdBy, JSON.stringify(metaData), step1Id);
  });

  return hashedChunkContent;
}

export async function processFile(fileKey: string, step1Id: string, step2Id: string, createdBy: string, projectId: string) {
  let fileContent = "";
  try {
    // Fetch the file content from S3
    const s3Object = await getS3Data(fileKey);

    fileContent = s3Object?.data?.content ?? "";
  } catch (error) {
    return { filename: fileKey, error: `Error reading file ${fileKey}: ${error}`, embeddings: null };
  }

  // Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter(300, 20);

  const chunks = textSplitter.splitText(fileContent);
  const metaData = { fileName: fileKey, numberOf_chunks: chunks.length.toString() };
  await createStepDetails(createdBy, JSON.stringify(metaData), step1Id);

  // Prepare list to store embeddings with metadata
  const embeddingsWithMetadata: EmbeddingMetadata[] = [];
  for (let index = 0; index < chunks.length; index++) {
    const chunk = chunks[index];
    try {
      const embedding = await generateEmbedding(chunk);

      // Add metadata with the embedding
      embeddingsWithMetadata.push({
        file_name: fileKey,
        chunk_index: index,
        chunk_content: chunk,
        project_id: projectId,
        embedding
      });
    } catch (error) {
      console.error(`Error generating embeddings for chunk ${index} in file ${fileKey}: ${error}`);
      return { filename: fileKey, error: `Error generating embeddings for chunk ${index}`, embeddings: null };
    }
  }

  const metaData2 = { fileName: fileKey, number_of_chunks: chunks.length.toString(), vector_dimensions: "1024" };

  await createStepDetails(createdBy, JSON.stringify(metaData2), step2Id);

  return { filename: fileKey, error: "", embeddings: embeddingsWithMetadata };
}

async function generateEmbedding(text: string): Promise<any> {
  try {
    // Prepare the request body
    const body = JSON.stringify({
      inputText: text
    });
    const endpoint = "https://bedrock.us-east-1.amazonaws.com"; // Adjust the region as necessary

    try {
      const response = await axios.post(endpoint, body, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer YOUR_AWS_BEDROCK_API_KEY" // Add your API key or authorization
        }
      });

      // Assuming the response structure includes the embedding under a field like 'embedding'
      return response.data.embedding; // Extract the embedding from the response
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw new Error("Failed to generate embedding");
    }
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

class RecursiveCharacterTextSplitter {
  chunkSize: number;
  chunkOverlap: number;

  constructor(chunkSize: number, chunkOverlap: number) {
    this.chunkSize = chunkSize;
    this.chunkOverlap = chunkOverlap;
  }

  splitText(text: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      // Create chunk based on the chunkSize
      let end = Math.min(start + this.chunkSize, text.length);
      let chunk = text.slice(start, end);

      // If there's more text left, overlap the chunk
      if (end < text.length) {
        // Ensure the chunk overlaps if necessary
        start = end - this.chunkOverlap;
      } else {
        start = end;
      }

      chunks.push(chunk);
    }

    return chunks;
  }
}
