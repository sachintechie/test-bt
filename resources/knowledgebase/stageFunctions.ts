
import {
  ActionStatus,
  ProjectStage,
  ProjectStatusEnum,
  ReferenceStage,
  ReferenceStatus
} from "@prisma/client";
import {
  createStepDetails,
  getProjectById,
  getReferenceByProjectId,
  getReferenceByProjectIdAndType,
  getStageByProjectId,
  getStageType,
  getStepByProjectId,
  getStepType,
  updateProjectStage,
  updateReferenceStage
} from "../db/adminDbFunctions";
import { RefType } from "../db/models";
import {
  generateSignedUrl,
  getS3Data,
  getS3DataWithoutContent,
  combineChunks,
  lambdaCallForPrinicplePolicyAdd
} from "./commonFunctions";
import {
  hashing,
  hashingAndStoreToBlockchain
} from "../avalanche/storeHashFunctions";
import { processFile, hashChunkContents, hashCombinedChunks } from "../admin_lambdas/dataPreparation";
import { addToOpenSearch } from "../opensearch/commonFunction";

/**
 * Handles processing and updating a specific stage in the project lifecycle.
 * @param tenantId - ID of the tenant.
 * @param tenantUserId - ID of the tenant user.
 * @param projectId - ID of the project.
 * @param stageTypeName - Name of the stage type.
 * @param referenceStage - Current reference stage.
 * @param referenceStatus - Current reference status.
 * @param steps - Array of steps with their names and actions.
 */
async function processStage(
  tenantId: string,
  tenantUserId: string,
  projectId: string,
  stageTypeName: string,
  referenceStage: ReferenceStage,
  referenceStatus: ReferenceStatus,
  steps: Array<{ name: string; action: Function }>
) {
  try{
  const stageType = await getStageType(stageTypeName);
  if (!stageType) {
    console.error(`Stage type "${stageTypeName}" not found.`);
    return;
  }

  const stage = await getStageByProjectId(
    tenantUserId,
    stageTypeName,
    stageTypeName,
    stageType.id,
    projectId,
    stageTypeName === "Data Source" ? 1 : 2 // Adjust stage number as needed
  );

  if (!stage) {
    console.error(`Stage "${stageTypeName}" not initialized.`);
    return;
  }

  const references = await getReferenceByProjectIdAndType(
    projectId,
    referenceStage,
    referenceStatus,
    RefType.DOCUMENT
  );

  if (!references?.length) {
    console.error(`No references found for stage "${stageTypeName}".`);
    return;
  }

  const refIds = references.map((ref) => ref.id);

  for (const step of steps) {
    const stepType = await getStepType(step.name);
    if (!stepType) {
      console.error(`Step type "${step.name}" not found.`);
      continue;
    }

    const stepInstance = await getStepByProjectId(
      tenantUserId,
      step.name,
      step.name,
      stepType.id,
      stage.id,
      steps.indexOf(step) + 1
    );

    console.log(`Processing step "${stepInstance?.name}"...`);

    if (!stepInstance) {
      console.error(`Step "${step.name}" not initialized.`);
      continue;
    }

    for (const reference of references) {
      await step.action(reference, stepInstance.id);
    }

  }
  return refIds;
}
catch(error){
  console.error("Error in processStage:", error);
  throw error;
}
}

/**
 * Example usage: Process the "Data Source" stage.
 */
export async function addStage_1(tenantId: string, tenantUserId: string, projectId: string, bucketName: string,chainType:string,roleArn:string) {
  try{
  console.log(`Processing stage "Data Source" for project ${projectId}`);
    const policyAdd = await lambdaCallForPrinicplePolicyAdd(projectId,roleArn);
    console.log("policyAdd", policyAdd);
    
  const refIds = await processStage(
    tenantId,
    tenantUserId,
    projectId,
    "Data Source",
    ReferenceStage.DATA_SOURCE,
    ReferenceStatus.APPROVED,
    [
      {
        name: "File upload from frontend",
        action: async (reference: any, stepId: string) => {
          console.log(`Uploading file "${reference.name}" to S3...`);
          const downloadUrl = await generateSignedUrl(reference.name,bucketName);
          const fileData = {
            fileName: reference.name,
            contentType: reference.contenttype,
            size: reference.size,
            downloadUrl
          };
          console.log("metaData", fileData);
          await createStepDetails(tenantUserId, JSON.stringify(fileData), stepId,reference.id,ActionStatus.COMPLETED);
        }
      },
      {
        name: "File hashing",
        action: async (reference: any, stepId: string) => {
          console.log(`Hashing file "${reference.name}"...`);

          const hashedData = { hash: reference.hash };
          console.log("metaData", hashedData);

          await createStepDetails(tenantUserId, JSON.stringify(hashedData), stepId,reference.id,ActionStatus.COMPLETED);
        }
      },
      {
        name: "Store to Blockchain",
        action: async (reference: any, stepId: string) => {
          console.log(`Storing hash "${reference.hash}" to blockchain...`);
          const blockchainHashedData = await hashingAndStoreToBlockchain(
            reference.hash,
            chainType
          );
          console.log("metaData", blockchainHashedData);
          await createStepDetails(
            tenantUserId,
            JSON.stringify(blockchainHashedData.data),
            stepId,reference.id,ActionStatus.COMPLETED
          );
        }
      }
    ]
  );

  // Update the stage and reference statuses
 // await updateProjectStage(projectId, ProjectStage.DATA_SOURCE, ProjectStatusEnum.ACTIVE);
  if(refIds != null && refIds?.length > 0){
  await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_SOURCE, ReferenceStatus.PROCESSING);
  }

  console.log(`Stage "Data Source" completed for project ${projectId}`);
  await addStage_dataIngestion(tenantId, tenantUserId, projectId,bucketName,chainType);
}
catch(error){
  console.error("Error in addStage_1:", error);
  throw error;
}
}

export async function addStage_dataIngestion(tenantId: string, tenantUserId: string, projectId: string,bucketName: string,chainType:string) {
  try {
    console.log("Processing addStage_dataIngestion:", { tenantId, tenantUserId, projectId });

    const refIds: string[] = [];

    // Step 1: Handle Data Ingestion Stage
    await handleDataIngestionStage(tenantUserId, projectId, refIds,bucketName);

    // Step 2: Handle Data Storage Stage
    await handleDataStorageStage(tenantUserId, projectId, refIds,bucketName,chainType);

    await addStage_dataPrep(tenantUserId,projectId,bucketName,chainType);

    console.log("addStage_dataIngestion completed successfully.");
  } catch (error) {
    console.error("Error in addStage_dataIngestion:", error);
    throw error;
  }
}

async function handleDataIngestionStage(tenantUserId: string, projectId: string, refIds: string[],bucketName: string) {
  const stageType = await getStageType("Data Ingestion");
  if (!stageType) return;

  const stage = await getStageByProjectId(tenantUserId, "Data Ingestion", "Data Ingestion", stageType.id, projectId, 2);
  const references = await getReferenceByProjectId(projectId, ReferenceStage.DATA_SOURCE, ReferenceStatus.PROCESSING);

  if (!stage || !references?.length) return;

  const stepType = await getStepType("Upload to S3");
  if (!stepType) return;

  const step = await getStepByProjectId(tenantUserId, "Upload to S3", "Upload to S3", stepType.id, stage.id, 1);
  if (!step) return;

  for (const reference of references) {
    if (!reference?.name) continue;

    const s3Data = await getS3DataWithoutContent(reference.name,bucketName);
    refIds.push(reference.id);

    await createStepDetails(tenantUserId, JSON.stringify(s3Data.data), step.id,reference.id,ActionStatus.COMPLETED);
  }

 // await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
  await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_INGESTION, ReferenceStatus.PROCESSING);
}

async function handleDataStorageStage(tenantUserId: string, projectId: string, refIds: string[],bucketName: string,chainType:string) {
  const stageType = await getStageType("Data Storage");
  if (!stageType) return;

  const stage = await getStageByProjectId(tenantUserId, "Data Storage", "Data Storage", stageType.id, projectId, 3);
  const references = await getReferenceByProjectId(projectId, ReferenceStage.DATA_INGESTION, ReferenceStatus.PROCESSING);

  if (!stage || !references?.length) return;

  const [stepType1, stepType2, stepType3] = await Promise.all([
    getStepType("Read file from s3"),
    getStepType("Hashing of s3 file"),
    getStepType("Store to Blockchain"),
  ]);
  if (!stepType1 || !stepType2 || !stepType3) return;

  const [step1, step2, step3] = await Promise.all([
    getStepByProjectId(tenantUserId, "Read file from s3", "Read file from s3", stepType1.id, stage.id, 1),
    getStepByProjectId(tenantUserId, "Hashing of s3 file", "Hashing of s3 file", stepType2.id, stage.id, 2),
    getStepByProjectId(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage.id, 3),
  ]);
  if (!step1 || !step2 || !step3) return;

  for (const reference of references) {
    if (!reference?.name || reference.reftype !== RefType.DOCUMENT) continue;

    const s3Data = await getS3Data(reference.name,bucketName);
    const fileMetadata = extractS3Metadata(s3Data);

    // Step 1: Read file from S3
    await createStepDetails(tenantUserId, JSON.stringify(fileMetadata), step1.id,reference.id,ActionStatus.COMPLETED);

    // Step 2: Hash S3 file content
    const hash = await hashing({ fileName: s3Data.data?.fileName, fileContent: s3Data.data?.content });
    await createStepDetails(tenantUserId, JSON.stringify({ hash: hash.data?.dataHash }), step2.id,reference.id,ActionStatus.COMPLETED);

    // Step 3: Store hash to Blockchain
    const blockchainData = await hashingAndStoreToBlockchain(
      { fileName: s3Data.data?.fileName, fileContent: s3Data.data?.content },
      chainType,
      false
    );
    await createStepDetails(tenantUserId, JSON.stringify(blockchainData.data), step3.id,reference.id,ActionStatus.COMPLETED);
  }

  //await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
  await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_STORAGE, ReferenceStatus.PROCESSING);
}

function extractS3Metadata(s3Data: any) {
  return {
    fileName: s3Data.data?.fileName,
    size: s3Data.data?.size,
    etag: s3Data.data?.etag,
    contentType: s3Data.data?.contentType,
    lastModified: s3Data.data?.lastModified,
    downloadUrl: s3Data.data?.downloadUrl,
  };
}
export async function addStage_dataPrep(tenantUserId: string, projectId: string, bucketName: string,chaintype:string) {
  try {
    console.log("projectId", projectId, tenantUserId);
    let file_embeddings=[];
    const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_STORAGE, ReferenceStatus.PROCESSING);
    const refIds: string[] = [];

    // Stage 4: Data Preparation
    const stageType4 = await getStageType("Data Preparation");
    if (stageType4) {
      const stage4 = await getStageByProjectId(tenantUserId, "Data Preparation", "Data Preparation", stageType4.id, projectId, 4);

      if (referenceList && referenceList.length > 0) {
        const [stepType1, stepType2, stepType3, stepType4, stepType5, stepType6, stepType7] = await Promise.all([
          getStepType("Chunking"),
          getStepType("Chunking hash"),
          getStepType("Embedding of chunks"),
          getStepType("Reconstruction of data"),
          getStepType("Store chunk hash to Blockchain"),
          getStepType("Hashing of reconstructive data"),
          getStepType("Store recombined file to Blockchain")
        ]);

        if (stage4 && stepType1 && stepType2 && stepType3 && stepType4 && stepType5 && stepType6 && stepType7) {
          const [step1, step2, step3, step4, step5, step6, step7] = await Promise.all([
            getStepByProjectId(tenantUserId, "Chunking", "Chunking", stepType1.id, stage4.id, 1),
            getStepByProjectId(tenantUserId, "Chunking hash", "Chunking hash", stepType2.id, stage4.id, 2),
            getStepByProjectId(tenantUserId, "Embedding of chunks", "Embedding of chunks", stepType3.id, stage4.id, 3),
            getStepByProjectId(tenantUserId, "Reconstruction of data", "Reconstruction of data", stepType4.id, stage4.id, 4),
            getStepByProjectId(
              tenantUserId,
              "Store chunk hash to Blockchain",
              "Store chunk hash to Blockchain",
              stepType5.id,
              stage4.id,
              5
            ),
            getStepByProjectId(
              tenantUserId,
              "Hashing of reconstructive data",
              "Hashing of reconstructive data",
              stepType6.id,
              stage4.id,
              6
            ),
            getStepByProjectId(
              tenantUserId,
              "Store recombined file to Blockchain",
              "Store recombined file to Blockchain",
              stepType7.id,
              stage4.id,
              7
            )
          ]);

          if (step1 && step2 && step3 && step4 && step5 && step6 && step7) {
            for (const reference of referenceList) {
              refIds.push(reference.id);

              if (reference.name && reference.reftype == RefType.DOCUMENT) {
                // Step 1 and Step 3: Chunking and Embedding of chunks
                const file_embedding = await processFile(reference.name, step1.id, step3.id, tenantUserId, projectId,bucketName,reference.id);
                file_embeddings.push({ file_embedding: file_embedding.embeddings, referenceId: reference.id });
                console.log("file_embedding", file_embeddings);

                if (file_embedding.embeddings) {
                  // Step 2: Chunking hash
                  const hashed_chunkcontent = await hashChunkContents(file_embedding.embeddings, step2.id, tenantUserId,reference.id);

                  // Step 5: Store chunk hash to Blockchain
                  if (hashed_chunkcontent) {
                    const blockchainHashedData = await hashingAndStoreToBlockchain(hashed_chunkcontent[0].hash, chaintype);
                    await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step5.id,reference.id,ActionStatus.COMPLETED);
                  }

                  // Step 4, 6, 7: Reconstruction, Hashing, and Storing recombined data on Blockchain
                  const combined_response = await combineChunks(file_embedding.embeddings);
                  if (combined_response) {
                    await hashCombinedChunks(combined_response, step4.id, step6.id, step7.id, tenantUserId,chaintype,reference.id);
                  }

                }
              }
            }

            // Update project and reference stage
          //  await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
            await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_PREPARATION, ReferenceStatus.PROCESSING);
          }
        }
      }
    }

    // Stage 5: RAG Ingestion
    const stageType5 = await getStageType("RAG Ingestion");
    if (stageType5) {
      const stage5 = await getStageByProjectId(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);
      const project = await getProjectById(projectId);
      if (referenceList && referenceList.length > 0) {
        const stepType1 = await getStepType("Writing to open search");

        if (stage5 && stepType1 && project.data) {
          const step1 = await getStepByProjectId(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1);

          if (file_embeddings && step1) {
            const fileEmbeddings = file_embeddings.map((ref) => ref.file_embedding).flat();
            console.log("fileEmbeddings", fileEmbeddings);
            // const fileEmbeddings = file_embeddings.map((ref) => ref.embeddings);
            const indexedFiles = await addToOpenSearch(fileEmbeddings,project?.data?.indexid?? "");

            for (const indexedFile of indexedFiles) {
               
              console.log("indexedFile", indexedFile);
              const refId = file_embeddings.find((ref) =>
                ref.file_embedding?.some((embedding) => embedding.file_name === indexedFile.fileName)
              )?.referenceId;

              console.log("refId", refId);
              const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
              const status = indexedFile.status === "success" ? ActionStatus.COMPLETED : ActionStatus.ERROR;
              await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id,refId ?? "",status);
            }
          }
        }

        // Update project and reference stage
       // await updateProjectStage(projectId, ProjectStage.PUBLISHED, ProjectStatusEnum.ACTIVE);
        await updateReferenceStage(projectId, refIds, ReferenceStage.PUBLISHED, ReferenceStatus.COMPLETED);
      }
    }

    return true;
  } catch (e) {
    console.error("Error in addStage_dataPrep:", e);
    throw e;
  }
}


