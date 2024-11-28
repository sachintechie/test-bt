import {
  createStage,
  createStep,
  createStepDetails,
  getReferenceByProjectId,
  getStageType,
  getStepType,
  updateProjectStage,
  updateReferenceStage
} from "../db/adminDbFunctions";
import { hashing, hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
import { ProjectStage, ProjectStatusEnum, ReferenceStage, ReferenceStatus } from "@prisma/client";
import {  getS3Data, getS3DataWithoutContent,dataPreperationLambda } from "../knowledgebase/commonFunctions";
import { RefType } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId,bucketName } = event;

    // Calls function to handle adding stages and steps for file processing
    const data = await addStageAndSteps(tenantUserId, projectId,bucketName);

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
export async function addStageAndSteps(tenantUserId: string, projectId: string,bucketName:string) {
  try {
    console.log("Creating admin project" , tenantUserId, projectId);
    //const stageType1 = await getStageType("Data Source");
    const refIds : string[] = []; 

    // Stage 2: Data Ingestion
    const stageType2 = await getStageType("Data Ingestion");
    if (stageType2) {
      const stage2 = await createStage(tenantUserId, "Data Ingestion", "Data Ingestion", stageType2.id, projectId, 2);
      // Retrieve details from the previous ingestion stage
      // const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
      const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_SOURCE,ReferenceStatus.PROCESSING);
      console.log("referenceList", referenceList);

      if (referenceList != null && referenceList?.length > 0) {
       // const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
       // const stepDetails = await getStepDetails(fileUploadStepId);

        if (stage2) {
          const stepType = await getStepType("Upload to S3");

          if (stepType) {
            const step1 = await createStep(tenantUserId, "Upload to S3", "Upload to S3", stepType.id, stage2.id, 1);
            for (const reference of referenceList) {
             // const data = JSON.parse(stepDetail.metadata);

            // Upload file content to S3
            if( reference.reftype == RefType.DOCUMENT && reference?.name){
            const s3Data = await getS3DataWithoutContent(reference?.name,bucketName);
            refIds.push(reference.id);

              await createStepDetails(tenantUserId, JSON.stringify(s3Data.data), step1.id);
            }
            }

            // Update project to reflect data storage status
            await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
            await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_INGESTION,ReferenceStatus.PROCESSING);
          }
        }
      }
    }

    // Stage 3: Data Storage
    const stageType3 = await getStageType("Data Storage");
    if (stageType3) {
      const stage3 = await createStage(tenantUserId, "Data Storage", "Data Storage", stageType3.id, projectId, 3);

      // Retrieve details from the previous ingestion stage
    //  const ingestionStageDetails = await getStageDetails(projectId, stageType2?.id || "");
    const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_INGESTION,ReferenceStatus.PROCESSING);

      if (referenceList != null && referenceList?.length > 0) {
       // const stepDetails = await getStepDetails(ingestionStageDetails.steps[0].id);
        const [stepType1, stepType2, stepType3] = await Promise.all([
          getStepType("Read file from s3"),
          getStepType("Hashing of s3 file"),
          getStepType("Store to Blockchain")
        ]);

        if (stepType1 && stepType2 && stepType3) {
          const [step1, step2, step3] = await Promise.all([
            createStep(tenantUserId, "Read file from s3", "Read file from s3", stepType1.id, stage3.id, 1),
            createStep(tenantUserId, "Hashing of s3 file", "Hashing of s3 file", stepType2.id, stage3.id, 2),
            createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage3.id, 3)
          ]);

          for (const reference of referenceList) {
           // const data = JSON.parse(stepDetail.metadata);
           if(reference?.name && reference.reftype === RefType.DOCUMENT){
            const getDataFromS3 = await getS3Data(reference.name,bucketName);
            console.log("getDataFromS3", getDataFromS3);
            const s3data = {
              fileName: getDataFromS3.data?.fileName,
              size: getDataFromS3.data?.size,
              etag: getDataFromS3.data?.etag,
              contentType: getDataFromS3.data?.contentType,
              lastModified: getDataFromS3.data?.lastModified,
              downloadUrl: getDataFromS3.data?.downloadUrl
        
            };

            // Step 1: Read file from S3
            await createStepDetails(tenantUserId, JSON.stringify(s3data), step1.id);

            // Step 2: Hash the S3 file data
            const s3File = { fileName: getDataFromS3?.data?.fileName, fileContent: getDataFromS3?.data?.content };
            console.log("s3File", s3File);
            const hash = await hashing(s3File);
            const hashedData = {
              hash: hash.data?.dataHash
            };
            await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id);

            // Step 3: Store the hashed data on the blockchain
            const blockchainHashedData = await hashingAndStoreToBlockchain(s3File,"Avalanche", false);
            await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
          }

          // Update project to reflect data preparation status
          await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
          await updateReferenceStage(projectId, refIds, ReferenceStage.DATA_STORAGE,ReferenceStatus.PROCESSING);

        }
      }
      }
    }

    await dataPreperationLambda(tenantUserId, projectId,bucketName);


    return true;
  } catch (e) {
    console.error("Error in addStageAndSteps:", e);
    throw e;
  }
}




