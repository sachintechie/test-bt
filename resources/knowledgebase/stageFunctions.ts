// import { ProjectStage, ProjectStatusEnum, ReferenceStage, ReferenceStatus } from "@prisma/client";
// import {
//   addReferenceToDb,
//   createStepDetails,
//   getReferenceByProjectId,
//   getStageByProjectId,
//   getStageType,
//   getStepByProjectId,
//   getStepType,
//   updateProjectStage,
//   updateReferenceStage
// } from "../db/adminDbFunctions";
// import { RefType } from "../db/models";
// import {
//   combineChunks,
//   dataPreperationLambda,
//   generateSignedUrl,
//   getS3Data,
//   getS3DataWithoutContent,
//   lambdaCallForIndexing,
//   storeHashByChainType
// } from "./commonFunctions";
// import { hashing, hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
// import { hashChunkContents, hashCombinedChunks, processFile } from "../admin_lambdas/dataPreparation";
// import { addToOpenSearch } from "../opensearch/commonFunction";

// export async function addStage_1(tenantId: string, tenantUserId: string, projectId: string) {
//   // Stage 1: Data Source
//   const refIds: string[] = [];
//   const stageType = await getStageType("Data Source");
//   const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_STORAGE, ReferenceStatus.UPLOADED);

//   if (stageType) {
//     const stage1 = await getStageByProjectId(tenantUserId, "Data Source", "Data Source", stageType.id, projectId, 1);

//     if (stage1) {
//       // Fetch step types for each action in the stage
//       const [stepType1, stepType2, stepType3] = await Promise.all([
//         getStepType("File upload from frontend"),
//         getStepType("File hashing"),
//         getStepType("Store to Blockchain")
//       ]);

//       if (stepType1 && stepType2 && stepType3) {
//         // Create steps for stage 1
//         const [step1, step2, step3] = await Promise.all([
//           getStepByProjectId(tenantUserId, "File upload from frontend", "File upload from frontend", stepType1.id, stage1.id, 1),
//           getStepByProjectId(tenantUserId, "File hashing", "File hashing", stepType2.id, stage1.id, 2),
//           getStepByProjectId(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage1.id, 3)
//         ]);
//         if (step1 && step2 && step3) {
//           for (const file of referenceList) {
//             file.reftype = RefType.DOCUMENT;
//             const ref = await addReferenceToDb(tenantId, file, false, projectId, ReferenceStatus.PROCESSING, true, tenantUserId);
//             if (ref.data?.id) refIds.push(ref.data?.id);

//             console.log("ref", ref);
//             // const fileSize = await getFileSizeFromBase64(file.fileContent)
//             const downloadUrl = await generateSignedUrl(file);

//             const fileData = { fileName: file.name, contentType: file.contenttype, size: file.size, downloadUrl: downloadUrl };
//             // Step 1: File upload details
//             await createStepDetails(tenantUserId, JSON.stringify(fileData), step1.id);

//             // Step 2: Hash the file data
//             const hashedData = {
//               hash: file.hash
//             };
//             await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id);

//             // Step 3: Store the hashed data on the blockchain
//             const blockchainHashedData = await storeHashByChainType(file?.hash ?? "", "Avalanche");
//             if (blockchainHashedData != null) await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
//           }
//         }

//         // Update project to reflect data ingestion status
//         await updateProjectStage(projectId, ProjectStage.DATA_SOURCE, ProjectStatusEnum.ACTIVE);
//         await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_SOURCE, ReferenceStatus.PROCESSING);
//       }
//     }
//   }
// }

// export async function addStage_dataIngestion(tenantId: string, tenantUserId: string, projectId: string) {
//   try {
//     console.log("Creating admin project", tenantUserId, projectId);
//     //const stageType1 = await getStageType("Data Source");
//     const refIds: string[] = [];

//     // Stage 2: Data Ingestion
//     const stageType2 = await getStageType("Data Ingestion");
//     if (stageType2) {
//       const stage2 = await getStageByProjectId(tenantUserId, "Data Ingestion", "Data Ingestion", stageType2.id, projectId, 2);
//       // Retrieve details from the previous ingestion stage
//       // const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
//       const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_SOURCE, ReferenceStatus.PROCESSING);
//       console.log("referenceList", referenceList);

//       if (referenceList != null && referenceList?.length > 0) {
//         // const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
//         // const stepDetails = await getStepDetails(fileUploadStepId);

//         if (stage2) {
//           const stepType = await getStepType("Upload to S3");

//           if (stepType) {
//             const step1 = await getStepByProjectId(tenantUserId, "Upload to S3", "Upload to S3", stepType.id, stage2.id, 1);
//             if (step1) {
//               for (const reference of referenceList) {
//                 // const data = JSON.parse(stepDetail.metadata);

//                 // Upload file content to S3
//                 if (reference?.name) {
//                   const s3Data = await getS3DataWithoutContent(reference?.name);
//                   refIds.push(reference.id);

//                   await createStepDetails(tenantUserId, JSON.stringify(s3Data.data), step1.id);
//                 }
//               }
//             }

//             // Update project to reflect data storage status
//             await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
//             await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_INGESTION, ReferenceStatus.PROCESSING);
//           }
//         }
//       }
//     }

//     // Stage 3: Data Storage
//     const stageType3 = await getStageType("Data Storage");
//     if (stageType3) {
//       const stage3 = await getStageByProjectId(tenantUserId, "Data Storage", "Data Storage", stageType3.id, projectId, 3);

//       // Retrieve details from the previous ingestion stage
//       //  const ingestionStageDetails = await getStageDetails(projectId, stageType2?.id || "");
//       const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_INGESTION, ReferenceStatus.PROCESSING);

//       if (referenceList != null && referenceList?.length > 0) {
//         // const stepDetails = await getStepDetails(ingestionStageDetails.steps[0].id);
//         const [stepType1, stepType2, stepType3] = await Promise.all([
//           getStepType("Read file from s3"),
//           getStepType("Hashing of s3 file"),
//           getStepType("Store to Blockchain")
//         ]);

//         if (stage3 && stepType1 && stepType2 && stepType3) {
//           const [step1, step2, step3] = await Promise.all([
//             getStepByProjectId(tenantUserId, "Read file from s3", "Read file from s3", stepType1.id, stage3.id, 1),
//             getStepByProjectId(tenantUserId, "Hashing of s3 file", "Hashing of s3 file", stepType2.id, stage3.id, 2),
//             getStepByProjectId(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage3.id, 3)
//           ]);

//           if (step1 && step2 && step3) {
//             for (const reference of referenceList) {
//               // const data = JSON.parse(stepDetail.metadata);
//               if (reference?.name && reference.reftype === RefType.DOCUMENT) {
//                 const getDataFromS3 = await getS3Data(reference.name);
//                 console.log("getDataFromS3", getDataFromS3);
//                 const s3data = {
//                   fileName: getDataFromS3.data?.fileName,
//                   size: getDataFromS3.data?.size,
//                   etag: getDataFromS3.data?.etag,
//                   contentType: getDataFromS3.data?.contentType,
//                   lastModified: getDataFromS3.data?.lastModified,
//                   downloadUrl: getDataFromS3.data?.downloadUrl
//                 };

//                 // Step 1: Read file from S3
//                 await createStepDetails(tenantUserId, JSON.stringify(s3data), step1.id);

//                 // Step 2: Hash the S3 file data
//                 const s3File = { fileName: getDataFromS3?.data?.fileName, fileContent: getDataFromS3?.data?.content };
//                 console.log("s3File", s3File);
//                 const hash = await hashing(s3File);
//                 const hashedData = {
//                   hash: hash.data?.dataHash
//                 };
//                 await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id);

//                 // Step 3: Store the hashed data on the blockchain
//                 const blockchainHashedData = await hashingAndStoreToBlockchain(s3File, "Avalanche", false);
//                 await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
//               }

//               // Update project to reflect data preparation status
//               await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
//               await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_STORAGE, ReferenceStatus.PROCESSING);
//             }
//           }
//         }
//       }
//     }

//     await dataPreperationLambda(tenantUserId, projectId);

//     return true;
//   } catch (e) {
//     console.error("Error in addStageAndSteps:", e);
//     throw e;
//   }
// }

// export async function addStage_dataPrep(tenantUserId: string, projectId: string) {
//   try {
//     console.log("projectId", projectId, tenantUserId);
//     let file_embeddings;
//     const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_STORAGE, ReferenceStatus.PROCESSING);
//     const refIds: string[] = [];

//     // Stage 4: Data Preparation
//     //const stageType1 = await getStageType("Data Source");

//     const stageType4 = await getStageType("Data Preparation");
//     if (stageType4) {
//       const stage4 = await getStageByProjectId(tenantUserId, "Data Preparation", "Data Preparation", stageType4.id, projectId, 4);

//       // const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
//       if (referenceList != null && referenceList?.length > 0) {
//         //  const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
//         // const stepDetails = await getStepDetails(fileUploadStepId);

//         // Retrieve details from the previous ingestion stage
//         //  const stepDetails = await getStageDetailsByProjectId(projectId);
//         const [stepType1, stepType2, stepType3, stepType4, stepType5, stepType6, stepType7] = await Promise.all([
//           getStepType("Chunking"),
//           getStepType("Chunking hash"),
//           getStepType("Embedding of chunks"),
//           getStepType("Reconstruction of data"),
//           getStepType("Store chunk hash to Blockchain"),
//           getStepType("Hashing of reconstructive data"),
//           getStepType("Store recombined file to Blockchain")
//         ]);

//         if (stage4 && stepType1 && stepType2 && stepType3 && stepType4 && stepType5 && stepType6 && stepType7) {
//           const [step1, step2, step3, step4, step5, step6, step7] = await Promise.all([
//             getStepByProjectId(tenantUserId, "Chunking", "Chunking", stepType1.id, stage4.id, 1),
//             getStepByProjectId(tenantUserId, "Chunking hash", "Chunking hash", stepType2.id, stage4.id, 2),
//             getStepByProjectId(tenantUserId, "Embedding of chunks", "Embedding of chunks", stepType3.id, stage4.id, 3),
//             getStepByProjectId(tenantUserId, "Reconstruction of data", "Reconstruction of data", stepType4.id, stage4.id, 4),
//             getStepByProjectId(
//               tenantUserId,
//               "Store chunk hash to Blockchain",
//               "Store chunk hash to Blockchain",
//               stepType5.id,
//               stage4.id,
//               5
//             ),
//             getStepByProjectId(
//               tenantUserId,
//               "Hashing of reconstructive data",
//               "Hashing of reconstructive data",
//               stepType6.id,
//               stage4.id,
//               6
//             ),
//             getStepByProjectId(
//               tenantUserId,
//               "Store recombined file to Blockchain",
//               "Store recombined file to Blockchain",
//               stepType7.id,
//               stage4.id,
//               7
//             )
//           ]);

//           if (step1 && step2 && step3 && step4 && step5 && step6 && step7) {
//             for (const reference of referenceList) {
//               // const data = JSON.parse(stepDetail.metadata);
//               refIds.push(reference.id);
//               // Step 1 and step 3: Chunking and Embedding of chunks
//               if (reference.name != null && reference.reftype == RefType.DOCUMENT) {
//                 file_embeddings = await processFile(reference.name, step1.id, step3.id, tenantUserId, projectId);
//                 let hashed_chunkcontent;
//                 if (file_embeddings.embeddings != null) {
//                   // Step 2: Chunking hash
//                   hashed_chunkcontent = await hashChunkContents(file_embeddings?.embeddings, step2.id, tenantUserId);
//                 } else {
//                   return false;
//                 }

//                 // Step 5: Store chunk hash to Blockchain

//                 if (hashed_chunkcontent != null) {
//                   const blockchainHashedData = await hashingAndStoreToBlockchain(hashed_chunkcontent[0].hash, "Avalanche");
//                   await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step5.id);
//                 }

//                 // Step 4,6,7:Hashing of reconstructive data , Store recombined file to Blockchain ,Store recombined file to Blockchain

//                 if (file_embeddings.embeddings != null) {
//                   // const combined_response1 = await lambdaCallForCombineChunks(file_embeddings.embeddings);
//                   // console.log("combined_response1_lambda", combined_response1);

//                   const combined_response = await combineChunks(file_embeddings?.embeddings);
//                   console.log("combined_response", combined_response);
//                   const hashCombinedData = await hashCombinedChunks(combined_response, step4.id, step6.id, step7.id, tenantUserId);
//                   console.log("hashCombinedData", hashCombinedData);
//                 }
//               }
//             }

//             // Update project to reflect data preparation status
//             await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
//             await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_PREPARATION, ReferenceStatus.PROCESSING);
//           }
//         }
//       }
//     }

//     // Stage 5: Rag Ingestion
//     const stageType5 = await getStageType("RAG Ingestion");
//     if (stageType5) {
//       const stage5 = await getStageByProjectId(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);

//       // Retrieve details from the previous ingestion stage
//       // const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_PREPARATION);

//       //const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
//       if (referenceList != null && referenceList?.length > 0) {
//         //  const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
//         //const stepDetails = await getStepDetails(fileUploadStepId);
//         const [stepType1] = await Promise.all([getStepType("Writing to open search")]);

//         if (stage5 && stepType1) {
//           const [step1] = await Promise.all([
//             getStepByProjectId(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1)
//           ]);

//           // const lambdaResponseForIndexing = await lambdaCallForIndexing(file_embeddings?.embeddings);
//           // console.log("lambdaResponseForIndexing", lambdaResponseForIndexing);
//           if (file_embeddings?.embeddings != null && step1) {
//             const indexedFiles: string[] = await addToOpenSearch(file_embeddings?.embeddings);
//             //  const indexedFiles: string[] = JSON.parse(openSearchResponse);

//             console.log("opensearchResponse", indexedFiles);
//             for (const indexedFile of indexedFiles) {
//               console.log("indexedFile", indexedFile);
//               const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
//               await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id);
//             }
//           }
//           // const indexedFiles: string[] = JSON.parse(lambdaResponseForIndexing);

//           // const responseForIndexing   = await indexing(file_embeddings?.embeddings);

//           // console.log("responseForIndexing", responseForIndexing);

//           // if(responseForIndexing != null){

//           // for (const indexedFile of responseForIndexing) {
//           //   const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
//           //   await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id);
//           // }
//           //}
//         }
//         // Update project to reflect data RAG_INGESTION status
//         await updateProjectStage(projectId, ProjectStage.RAG_INGESTION, ProjectStatusEnum.ACTIVE);
//         await updateReferenceStage(projectId, refIds, ReferenceStage.RAG_INGESTION, ReferenceStatus.PROCESSING);
//       }
//     }

//     // Stage 5: Published
//     const stageType6 = await getStageType("Published");
//     if (stageType6) {
//       const stage6 = await getStageByProjectId(tenantUserId, "Published", "Published", stageType6.id, projectId, 6);

//       // Update project to reflect data preparation status
//       await updateProjectStage(projectId, ProjectStage.PUBLISHED, ProjectStatusEnum.ACTIVE);
//       await updateReferenceStage(projectId, refIds, ReferenceStage.PUBLISHED, ReferenceStatus.COMPLETED);
//     }

//     return true;
//   } catch (e) {
//     console.error("Error in addStageAndSteps:", e);
//     throw e;
//   }
// }


import {
  ProjectStage,
  ProjectStatusEnum,
  ReferenceStage,
  ReferenceStatus
} from "@prisma/client";
import {
  createStepDetails,
  getReferenceByProjectId,
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
  combineChunks
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

  const references = await getReferenceByProjectId(
    projectId,
    referenceStage,
    referenceStatus
  );

  if (!references?.length) {
    console.error(`No references found for stage "${stageTypeName}".`);
    return;
  }

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
}
catch(error){
  console.error("Error in processStage:", error);
  throw error;
}
}

/**
 * Example usage: Process the "Data Source" stage.
 */
export async function addStage_1(tenantId: string, tenantUserId: string, projectId: string, bucketName: string,chainType:string) {
  try{
  console.log(`Processing stage "Data Source" for project ${projectId}`);
  await processStage(
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
          const downloadUrl = await generateSignedUrl(reference,bucketName);
          const fileData = {
            fileName: reference.name,
            contentType: reference.contenttype,
            size: reference.size,
            downloadUrl
          };
          console.log("metaData", fileData);
          await createStepDetails(tenantUserId, JSON.stringify(fileData), stepId);
        }
      },
      {
        name: "File hashing",
        action: async (reference: any, stepId: string) => {
          console.log(`Hashing file "${reference.name}"...`);

          const hashedData = { hash: reference.hash };
          console.log("metaData", hashedData);

          await createStepDetails(tenantUserId, JSON.stringify(hashedData), stepId);
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
            stepId
          );
        }
      }
    ]
  );

  // Update the stage and reference statuses
  await updateProjectStage(projectId, ProjectStage.DATA_SOURCE, ProjectStatusEnum.ACTIVE);
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

    await createStepDetails(tenantUserId, JSON.stringify(s3Data.data), step.id);
  }

  await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
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
    await createStepDetails(tenantUserId, JSON.stringify(fileMetadata), step1.id);

    // Step 2: Hash S3 file content
    const hash = await hashing({ fileName: s3Data.data?.fileName, fileContent: s3Data.data?.content });
    await createStepDetails(tenantUserId, JSON.stringify({ hash: hash.data?.dataHash }), step2.id);

    // Step 3: Store hash to Blockchain
    const blockchainData = await hashingAndStoreToBlockchain(
      { fileName: s3Data.data?.fileName, fileContent: s3Data.data?.content },
      chainType,
      false
    );
    await createStepDetails(tenantUserId, JSON.stringify(blockchainData.data), step3.id);
  }

  await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
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
    let file_embeddings;
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
                file_embeddings = await processFile(reference.name, step1.id, step3.id, tenantUserId, projectId,bucketName);

                if (file_embeddings.embeddings) {
                  // Step 2: Chunking hash
                  const hashed_chunkcontent = await hashChunkContents(file_embeddings.embeddings, step2.id, tenantUserId);

                  // Step 5: Store chunk hash to Blockchain
                  if (hashed_chunkcontent) {
                    const blockchainHashedData = await hashingAndStoreToBlockchain(hashed_chunkcontent[0].hash, chaintype);
                    await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step5.id);
                  }

                  // Step 4, 6, 7: Reconstruction, Hashing, and Storing recombined data on Blockchain
                  const combined_response = await combineChunks(file_embeddings.embeddings);
                  if (combined_response) {
                    await hashCombinedChunks(combined_response, step4.id, step6.id, step7.id, tenantUserId,chaintype);
                  }
                }
              }
            }

            // Update project and reference stage
            await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
            await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_PREPARATION, ReferenceStatus.PROCESSING);
          }
        }
      }
    }

    // Stage 5: RAG Ingestion
    const stageType5 = await getStageType("RAG Ingestion");
    if (stageType5) {
      const stage5 = await getStageByProjectId(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);

      if (referenceList && referenceList.length > 0) {
        const stepType1 = await getStepType("Writing to open search");

        if (stage5 && stepType1) {
          const step1 = await getStepByProjectId(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1);

          if (file_embeddings?.embeddings && step1) {
            const indexedFiles = await addToOpenSearch(file_embeddings.embeddings);

            for (const indexedFile of indexedFiles) {
              const metaData = { filename: indexedFile, vector_database: "OPENSEARCH" };
              await createStepDetails(tenantUserId, JSON.stringify(metaData), step1.id);
            }
          }
        }

        // Update project and reference stage
        await updateProjectStage(projectId, ProjectStage.RAG_INGESTION, ProjectStatusEnum.ACTIVE);
        await updateReferenceStage(projectId, refIds, ReferenceStage.RAG_INGESTION, ReferenceStatus.PROCESSING);
      }
    }

    return true;
  } catch (e) {
    console.error("Error in addStage_dataPrep:", e);
    throw e;
  }
}


