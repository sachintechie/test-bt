import {
  createStage,
  createStep,
  createStepDetails,
  getProjectById,
  getReferenceByProjectId,
  getStageType,
  getStepType,
  updateProjectStage,
  updateReferenceStage
} from "../db/adminDbFunctions";
import { hashing, hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
import { ActionStatus, ProjectStage, ProjectStatusEnum, ReferenceStage, ReferenceStatus } from "@prisma/client";
import { combineChunks, streamToBuffer, storeHashByChainType, getS3ActualData } from "../knowledgebase/commonFunctions";
import { EmbeddingMetadata, GroupedChunk, HashedEntry, RefType } from "../db/models";
import { Readable } from "stream";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { TextDecoder, TextEncoder } from "util"; // Ensure TextDecoder is available for decoding
import { addToOpenSearch } from "../opensearch/commonFunction";
const client = new BedrockRuntimeClient({
  region: "us-east-1" // Replace with your AWS region
});
export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId, bucketName } = event;

    // Calls function to handle adding stages and steps for file processing
    const data = await addStageAndSteps(tenantUserId, projectId, bucketName);

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
export async function addStageAndSteps(tenantUserId: string, projectId: string, bucketName: string) {
  try {
    console.log("projectId", projectId, tenantUserId);
    let file_embeddings = [];
    const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_STORAGE, ReferenceStatus.PROCESSING);
    const refIds: string[] = [];
    const project = await getProjectById(projectId);

    // Stage 4: Data Preparation
    //const stageType1 = await getStageType("Data Source");

    const stageType4 = await getStageType("Data Preparation");
    if (stageType4) {
      const stage4 = await createStage(tenantUserId, "Data Preparation", "Data Preparation", stageType4.id, projectId, 4);

      // const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
      if (referenceList != null && referenceList?.length > 0) {
        //  const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
        // const stepDetails = await getStepDetails(fileUploadStepId);

        // Retrieve details from the previous ingestion stage
        //  const stepDetails = await getStageDetailsByProjectId(projectId);
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
            createStep(tenantUserId, "Reconstruction of data", "Reconstruction of data", stepType4.id, stage4.id, 4),
            createStep(tenantUserId, "Store chunk hash to Blockchain", "Store chunk hash to Blockchain", stepType5.id, stage4.id, 5),
            createStep(tenantUserId, "Hashing of reconstructive data", "Hashing of reconstructive data", stepType6.id, stage4.id, 6),
            createStep(
              tenantUserId,
              "Store recombined file to Blockchain",
              "Store recombined file to Blockchain",
              stepType7.id,
              stage4.id,
              7
            )
          ]);

          for (const reference of referenceList) {
            // const data = JSON.parse(stepDetail.metadata);
            // Step 1 and step 3: Chunking and Embedding of chunks
            if (reference.name != null && reference.reftype == RefType.DOCUMENT) {
              refIds.push(reference.id);
              const file_embedding = await processFile(
                reference.name,
                step1.id,
                step3.id,
                tenantUserId,
                projectId,
                bucketName,
                reference.id
              );
              file_embeddings.push({ file_embedding: file_embedding.embeddings,
                 referenceId: reference.id });
              console.log("file_embedding", file_embedding);
              let hashed_chunkcontent;
              if (file_embedding.embeddings != null) {
                // Step 2: Chunking hash
                hashed_chunkcontent = await hashChunkContents(file_embedding?.embeddings, step2.id, tenantUserId, reference.id);
              } else {
                return false;
              }

              // Step 5: Store chunk hash to Blockchain

              if (hashed_chunkcontent != null) {
                const blockchainHashedData = await hashingAndStoreToBlockchain(hashed_chunkcontent[0].hash, project.data?.chaintype ?? "");
                await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step5.id, reference.id,ActionStatus.COMPLETED);
              }

              // Step 4,6,7:Hashing of reconstructive data , Store recombined file to Blockchain ,Store recombined file to Blockchain

              if (file_embedding.embeddings != null) {
                // const combined_response1 = await lambdaCallForCombineChunks(file_embeddings.embeddings);
                // console.log("combined_response1_lambda", combined_response1);

                const combined_response = await combineChunks(file_embedding?.embeddings);
                console.log("combined_response", combined_response);
                const hashCombinedData = await hashCombinedChunks(
                  combined_response,
                  step4.id,
                  step6.id,
                  step7.id,
                  tenantUserId,
                  project.data?.chaintype ?? "",
                  reference.id
                );
                console.log("hashCombinedData", hashCombinedData);
              }
            }
          }

          // Update project to reflect data preparation status
          await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
          await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_PREPARATION, ReferenceStatus.PROCESSING);
        }
      }
    }

    // Stage 5: Rag Ingestion
    const stageType5 = await getStageType("RAG Ingestion");
    if (stageType5) {
      const stage5 = await createStage(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);

      // Retrieve details from the previous ingestion stage
      // const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_PREPARATION);

      //const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
      if (referenceList != null && referenceList?.length > 0) {
        //  const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
        //const stepDetails = await getStepDetails(fileUploadStepId);
        const [stepType1] = await Promise.all([getStepType("Writing to open search")]);
        const project = await getProjectById(projectId);
        if (stepType1) {
          const [step1] = await Promise.all([
            createStep(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1)
          ]);

          // const lambdaResponseForIndexing = await lambdaCallForIndexing(file_embeddings?.embeddings);
          // console.log("lambdaResponseForIndexing", lambdaResponseForIndexing);
          if (file_embeddings != null) {
            const fileEmbeddings = file_embeddings.map((ref) => ref?.file_embedding).flat();
            console.log("fileEmbeddings", fileEmbeddings);
            const indexedFiles = await addToOpenSearch(fileEmbeddings, project?.data?.indexid ?? "");

            //  const indexedFiles: string[] = JSON.parse(openSearchResponse);

            console.log("opensearchResponse", indexedFiles);
            for (const indexedFile of indexedFiles) {
              console.log("indexedFile", indexedFile);
              const refId = file_embeddings.find((ref) =>
                ref.file_embedding?.some((embedding) => embedding.file_name === indexedFile.fileName)
              )?.referenceId;
              console.log("refId", refId);
              const status = indexedFile.status === "success" ? ActionStatus.COMPLETED : ActionStatus.ERROR;

              const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
              await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id, refId ?? "",status);
            }
          }
          // const indexedFiles: string[] = JSON.parse(lambdaResponseForIndexing);

          // const responseForIndexing   = await indexing(file_embeddings?.embeddings);

          // console.log("responseForIndexing", responseForIndexing);

          // if(responseForIndexing != null){

          // for (const indexedFile of responseForIndexing) {
          //   const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
          //   await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id);
          // }
          //}
        }
        // Update project to reflect data RAG_INGESTION status
        await updateProjectStage(projectId, ProjectStage.RAG_INGESTION, ProjectStatusEnum.ACTIVE);
        await updateReferenceStage(projectId, refIds, ReferenceStage.RAG_INGESTION, ReferenceStatus.PROCESSING);
      }
    }

    // Stage 5: Published
    const stageType6 = await getStageType("Published");
    if (stageType6) {
      const stage6 = await createStage(tenantUserId, "Published", "Published", stageType6.id, projectId, 6);

      // Update project to reflect data preparation status
      await updateProjectStage(projectId, ProjectStage.PUBLISHED, ProjectStatusEnum.ACTIVE);
      await updateReferenceStage(projectId, refIds, ReferenceStage.PUBLISHED, ReferenceStatus.COMPLETED);
    }

    return true;
  } catch (e) {
    console.error("Error in addStageAndSteps:", e);
    throw e;
  }
}

export async function hashCombinedChunks(
  combinedResponse: Array<any>,
  step4Id: string,
  step6Id: string,
  step7Id: string,

  createdBy: string,
  chainType: string,
  refId: string
) {
  // console.log("combinedResponseBody", combinedResponseBody);
  const hashedData: Array<{ file_name: string; file_content_hash: string }> = [];

  // // Parse the combined response body (assuming it's a JSON array)
  // const combinedResponse: Array<any> = JSON.parse(combinedResponseBody);

  for (const entry of combinedResponse) {
    // Step detail for reconstruction of data

    const metadata4 = { file_name: entry["file_name"] };
    console.log("metadata4", metadata4);

    await createStepDetails(createdBy, JSON.stringify(metadata4), step4Id, refId,ActionStatus.COMPLETED);

    // Hash the content
    const fileContent = entry["file_content"] || "";
    console.log("------------------------------------------------------------------------");
    console.log(fileContent); // Equivalent to your print statement

    // Base64 encode the file content
    // const encodedBytes = Buffer.from(fileContent, "utf-8");
    // const base64Content = encodedBytes.toString("base64");
    let base64Content;

    if (Buffer.isBuffer(fileContent)) {
      base64Content = fileContent.toString("base64");
    } else if (typeof fileContent === "string") {
      base64Content = Buffer.from(fileContent); // Convert string to Buffer
      base64Content = base64Content.toString("base64");
    } else if (fileContent instanceof Readable) {
      base64Content = await streamToBuffer(fileContent);
      base64Content = base64Content.toString("base64");
    } else {
      throw new Error("Unexpected type for s3Details.Body");
    }

    console.log("base64Content", base64Content);

    // Create the JSON response content
    const content = {
      fileName: entry["file_name"],
      fileContent: base64Content
    };

    // Hash the content
    const fileContentHash = await hashing(content);

    // Prepare the hashed entry
    const hashedEntry = {
      file_name: entry["file_name"],
      file_content_hash: fileContentHash.data?.dataHash || ""
    };
    const hashedFileData = {
      hash: fileContentHash.data?.dataHash
    };

    // Push the hashed entry to the result array
    hashedData.push(hashedEntry);
    console.log("hashedEntry", hashedEntry);

    await createStepDetails(createdBy, JSON.stringify(hashedFileData), step6Id, refId,ActionStatus.COMPLETED);

    const combinedResponse = await storeHashByChainType(hashedEntry.file_content_hash, chainType);
    console.log("combinedResponse", combinedResponse);
    if (combinedResponse != null) await createStepDetails(createdBy, JSON.stringify(combinedResponse.data), step7Id, refId,ActionStatus.COMPLETED);
  }
  console.log("hashedData", hashedData);

  return hashedData;
}

export async function hashChunkContents(
  allEmbeddingsWithMetadata: EmbeddingMetadata[],
  step1Id: string,
  createdBy: string,
  refId: string
): Promise<GroupedChunk[]> {
  const hashedDataPromises = allEmbeddingsWithMetadata.map(async (entry) => {
    const chunkContent = entry.chunk_content || "";
    const chunkHash = await hashing(chunkContent);

    return {
      file_name: entry.file_name,
      chunk_index: entry.chunk_index,
      chunk_hash: chunkHash.data?.dataHash ?? "",
      project_id: entry.project_id
    } as HashedEntry;
  });

  const hashedData = await Promise.all(hashedDataPromises);

  // Group hashed data by file_name using a Map
  const groupedChunks = new Map<string, HashedEntry[]>();
  for (const chunk of hashedData) {
    if (!groupedChunks.has(chunk.file_name)) {
      groupedChunks.set(chunk.file_name, []);
    }
    groupedChunks.get(chunk.file_name)!.push(chunk);
  }

  // Create the grouped chunk list and hash the chunk groups
  const hashedChunkContentPromises = Array.from(groupedChunks.values()).map(async (group) => {
    const hashContent = await hashing(group);
    const fileName = group[0].file_name;

    // Metadata for step details
    const metaData = { fileName, hash: hashContent.data?.dataHash ?? "" };
    await createStepDetails(createdBy, JSON.stringify(metaData), step1Id, refId,ActionStatus.COMPLETED);

    return {
      file_name: fileName,
      hash: hashContent.data?.dataHash ?? ""
    } as GroupedChunk;
  });

  const hashedChunkContent = await Promise.all(hashedChunkContentPromises);

  console.log("hashedChunkContent", hashedChunkContent);

  return hashedChunkContent;
}

export async function processFile(
  fileKey: string,
  step1Id: string,
  step2Id: string,
  createdBy: string,
  projectId: string,
  bucketName: string,
  refId: string
) {
  let fileContent = "";
  try {
    // Fetch the file content from S3
    const s3Object = await getS3ActualData(fileKey, bucketName);
    if (s3Object.data?.content == null) {
      return { filename: fileKey, error: `Error reading file ${fileKey}: File not found`, embeddings: null };
    }
    fileContent = s3Object?.data?.content ?? "";
  } catch (error) {
    return { filename: fileKey, error: `Error reading file ${fileKey}: ${error}`, embeddings: null };
  }
  console.log("fileContent", fileContent);

  // Split text into chunks
  const textSplitter = new RecursiveCharacterTextSplitter(300, 20);
  const chunks = textSplitter.splitText(fileContent);
  const metaData = { fileName: fileKey, number_of_chunks: chunks.length.toString() };
  console.log("metaData", metaData);
  await createStepDetails(createdBy, JSON.stringify(metaData), step1Id, refId,ActionStatus.COMPLETED);

  // Prepare list to store embeddings with metadata
  const embeddingsWithMetadata: EmbeddingMetadata[] = [];

  // Adjust the batch size and concurrency limit
  const batchSize = 25; // Number of chunks per batch
  const concurrencyLimit = 3; // Limit of concurrent batches

  try {
    // Process chunks in parallel batches
    const results = await processBatchesInParallel(chunks, batchSize, concurrencyLimit, fileKey, projectId, refId);

    // Flatten the results and add metadata to the embeddings
    embeddingsWithMetadata.push(...results);

    console.log("embeddingsWithMetadata", embeddingsWithMetadata);
  } catch (error) {
    console.error(`Error processing embeddings for file ${fileKey}: ${error}`);
    return { filename: fileKey, error: `Error processing embeddings`, embeddings: null };
  }

  const metaData2 = { fileName: fileKey, number_of_chunks: chunks.length.toString(), vector_dimensions: "1024" };
  console.log("metaData2", metaData2);

  await createStepDetails(createdBy, JSON.stringify(metaData2), step2Id, refId,ActionStatus.COMPLETED);

  return { filename: fileKey, error: "", embeddings: embeddingsWithMetadata };
}

// Helper function to process batches with concurrency control
// Helper function to process batches with concurrency control
export async function processBatchesInParallel(
  chunks: string[],
  batchSize: number,
  concurrencyLimit: number,
  fileKey: string,
  projectId: string,
  refId: string
): Promise<EmbeddingMetadata[]> {
  const results: EmbeddingMetadata[] = [];
  const batchPromises: Promise<EmbeddingMetadata[]>[] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const batchIndex = i / batchSize;

    // Wait for previous batches to complete if concurrency limit is reached
    if (batchPromises.length >= concurrencyLimit) {
      const completedBatches = await Promise.all(batchPromises);
      completedBatches.forEach((batchResult) => results.push(...batchResult)); // Flatten the completed batches
      batchPromises.length = 0; // Clear completed batch promises
    }

    // Process batch in the background
    batchPromises.push(processEmbeddingBatch(batch, fileKey, projectId, refId, batchIndex));
  }

  // Process any remaining batches
  if (batchPromises.length > 0) {
    const remainingBatches = await Promise.all(batchPromises);
    remainingBatches.forEach((batchResult) => results.push(...batchResult)); // Flatten remaining batches
  }

  return results;
}

// Helper function to process a batch of chunks and generate embeddings
export async function processEmbeddingBatch(
  batch: string[],
  fileKey: string,
  projectId: string,
  refId: string,
  batchIndex: number
): Promise<EmbeddingMetadata[]> {
  const embeddingsWithMetadata: EmbeddingMetadata[] = [];

  await Promise.all(
    batch.map(async (chunk, chunkIndex) => {
      try {
        const embedding = await generateEmbedding(chunk);
        embeddingsWithMetadata.push({
          file_name: fileKey,
          chunk_index: batchIndex * batch.length + chunkIndex,
          chunk_content: chunk,
          project_id: projectId,
          ref_id: refId,
          embedding
        });
      } catch (error) {
        console.error(`Error generating embeddings for chunk in batch ${batchIndex} for file ${fileKey}: ${error}`);
      }
    })
  );

  return embeddingsWithMetadata;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0", // Replace with the correct model ID
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({ inputText: text })
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("responseBody", responseBody);

    // Assuming the response contains an `embedding` array within `responseBody`
    return responseBody.embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Concatenate the array of texts into a single string, with a separator (e.g., newline or space)
  const concatenatedText = texts.join("\n"); // Use "\n" or any other delimiter to separate chunks

  // Prepare the body for the InvokeModelCommand, ensuring it's in Uint8Array format
  const requestBody = JSON.stringify({
    inputText: concatenatedText // Pass the concatenated string as input
  });

  // Encode the body to Uint8Array (binary format)
  const encodedBody = new TextEncoder().encode(requestBody);
  const command = new InvokeModelCommand({
    modelId: "amazon.titan-embed-text-v2:0", // Replace with the correct model ID
    contentType: "application/json",
    accept: "application/json",
    body: encodedBody
  });

  try {
    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("responseBody", responseBody);

    // Assuming the response contains an `embedding` array for each input text
    return responseBody.embeddings; // This should be an array of embeddings corresponding to each input text
  } catch (error) {
    console.error("Error generating embeddings:", error);
    throw error;
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
