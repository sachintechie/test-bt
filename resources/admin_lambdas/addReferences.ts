import {
  createStage,
  createStep,
  createStepDetails,
  getStageDetails,
  getStageType,
  getStepDetails,
  getStepType,
  updateProjectStage
} from "../db/adminDbFunctions";
import { hashing, hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
import { ProjectStage, ProjectStatusEnum } from "@prisma/client";
import { addToS3Bucket, getS3Data } from "../knowledgebase/commonFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { projectId, files, datasource_id, tenantUserId } = event;

    // Calls function to handle adding stages and steps for file processing
    const data = await addStageAndSteps(tenantUserId, projectId, files);

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
export async function addStageAndSteps(tenantUserId: string, projectId: string, files: any) {
  try {
    // Stage 1: Data Source
    const stageType = await getStageType("Data Source");
    if (stageType) {
      const stage1 = await createStage(tenantUserId, "Data Source", "Data Source", stageType.id, projectId);
      if (stage1) {
        // Fetch step types for each action in the stage
        const [stepType1, stepType2, stepType3] = await Promise.all([
          getStepType("File upload from frontend"),
          getStepType("File hashing"),
          getStepType("Store to Blockchain")
        ]);

        if (stepType1 && stepType2 && stepType3) {
          // Create steps for stage 1
          const [step1, step2, step3] = await Promise.all([
            createStep(tenantUserId, "File upload from frontend", "File upload from frontend", stepType1.id, stage1.id),
            createStep(tenantUserId, "File hashing", "File hashing", stepType2.id, stage1.id),
            createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage1.id)
          ]);

          for (const file of files) {
            const fileData = { fileName: file.fileName, fileContent: file.fileContent };

            // Step 1: File upload details
            await createStepDetails(tenantUserId, JSON.stringify(fileData), step1.id);

            // Step 2: Hash the file data
            const hashedData = await hashing(fileData);
            await createStepDetails(tenantUserId, JSON.stringify(hashedData.data?.dataHash), step2.id);

            // Step 3: Store the hashed data on the blockchain
            const blockchainHashedData = await hashingAndStoreToBlockchain(fileData, false);
            await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
          }

          // Update project to reflect data ingestion status
          await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
        }
      }
    }

    // Stage 2: Data Ingestion
    const stageType2 = await getStageType("Data Ingestion");
    if (stageType2) {
      const stage2 = await createStage(tenantUserId, "Data Ingestion", "Data Ingestion", stageType2.id, projectId);
      if (stage2) {
        const stepType = await getStepType("Upload to S3");

        if (stepType) {
          const step1 = await createStep(tenantUserId, "Upload to S3", "Upload to S3", stepType.id, stage2.id);
          for (const file of files) {
            // Upload file content to S3
            const s3Data = await addToS3Bucket(file.fileName, file.fileContent);
            await createStepDetails(tenantUserId, JSON.stringify(s3Data.data), step1.id);
          }

          // Update project to reflect data storage status
          await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
        }
      }
    }

    // Stage 3: Data Storage
    const stageType3 = await getStageType("Data Storage");
    if (stageType3) {
      const stage3 = await createStage(tenantUserId, "Data Storage", "Data Storage", stageType3.id, projectId);

      // Retrieve details from the previous ingestion stage
      const ingestionStageDetails = await getStageDetails(projectId, stageType2?.id || "");
      if (ingestionStageDetails != null && ingestionStageDetails?.steps.length > 0) {
        const stepDetails = await getStepDetails(ingestionStageDetails.steps[0].id);
        const [stepType1, stepType2, stepType3] = await Promise.all([
          getStepType("Read file from s3"),
          getStepType("Hashing of s3 file"),
          getStepType("Store to Blockchain")
        ]);

        if (stepType1 && stepType2 && stepType3) {
          const [step1, step2, step3] = await Promise.all([
            createStep(tenantUserId, "Read file from s3", "Read file from s3", stepType1.id, stage3.id),
            createStep(tenantUserId, "Hashing of s3 file", "Hashing of s3 file", stepType2.id, stage3.id),
            createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage3.id)
          ]);

          for (const stepDetail of stepDetails) {
            const data = JSON.parse(stepDetail.metadata);
            const getDataFromS3 = await getS3Data(data.fileName);

            // Step 1: Read file from S3
            await createStepDetails(tenantUserId, JSON.stringify(getDataFromS3.data), step1.id);

            // Step 2: Hash the S3 file data
            const s3File = { fileName: getDataFromS3?.data?.fileName, fileContent: getDataFromS3?.data?.s3Object };
            const hashedData = await hashing(s3File);
            await createStepDetails(tenantUserId, JSON.stringify(hashedData.data?.dataHash), step2.id);

            // Step 3: Store the hashed data on the blockchain
            const blockchainHashedData = await hashingAndStoreToBlockchain(s3File, false);
            await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
          }

          // Update project to reflect data preparation status
          await updateProjectStage(projectId, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
        }
      }
    }

    return true;
  } catch (e) {
    console.error("Error in addStageAndSteps:", e);
    throw e;
  }
}


// export async function addReferences(tenantId: string, projectId: string, files: any, datasource_id: string) {
//   for (const file of files) {
//     let data;
//     let isIngested = false;
//     const dataStoredToDb: any = {
//       s3PreStoreHash: "",
//       s3PreStoreTxHash: "",
//       s3PostStoreHash: "",
//       s3PostStoreTxHash: "",
//       chainType: "",
//       chainId: "",
//       status:""
//     };

//     const hashedData = {
//       fileName: file.fileName,
//       fileContent: file.fileContent
//     };
//     const s3PreHashedData = await hashingAndStoreToBlockchain(hashedData, false);
//     dataStoredToDb.chainType = s3PreHashedData.data?.chainType;
//     dataStoredToDb.chainId = s3PreHashedData.data?.chainId;
//     dataStoredToDb.status = s3PreHashedData.data?.status;

//     if (s3PreHashedData.error) {
//       return {
//         document: null,
//         error: s3PreHashedData.error
//       };
//     }
//     dataStoredToDb.s3PreStoreHash = s3PreHashedData.data?.dataHash;
//     console.log("s3PreStoreHash", s3PreHashedData.data?.dataHash);
//     dataStoredToDb.s3PreStoreTxHash = s3PreHashedData.data?.dataTxHash;

//     console.log("s3PreStoreTxHash", s3PreHashedData.data?.dataTxHash);

//     data = await addToS3Bucket(file.fileName, file.fileContent);
//     if (data.data == null) {
//       return {
//         document: null,
//         error: data.error
//       };
//     }

//     const uploadedFile = {
//       fileName: data?.data?.fileName,
//       fileContent: data?.data?.s3Object
//     };
//     console.log("uploadedFile", uploadedFile);
//     // const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile,true);
//     // dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.dataHash;
//     // dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.dataTxHash;

//     // console.log("s3PostStorHash", s3PostHashedData.data?.dataHash);
//     // console.log("s3PostStoreTxHash", s3PostHashedData.data?.dataTxHash);
//     const ref = await addDocumentReference(
//       tenantId,
//       file,
//       RefType.DOCUMENT,
//       isIngested,
//       projectId,
//       datasource_id,
//       data?.data,
//       "null",
//       dataStoredToDb
//     );
//     if(ref.data != null){
//     const refTxHash = await addRefTransaction(tenantId,ref.data.id,dataStoredToDb.s3PreStoreHash, projectId,
//       dataStoredToDb.s3PreStoreTxHash,dataStoredToDb.chainId,dataStoredToDb.chainType,process.env["SOLANA_NETWORK"] ?? "",
//       dataStoredToDb.status);
//       console.log("trnasctionRefHash", refTxHash);

//     }
//   }

//   const updatedProject = await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
//   console.log("updatedProject", updatedProject);
//   return updatedProject;
// }
