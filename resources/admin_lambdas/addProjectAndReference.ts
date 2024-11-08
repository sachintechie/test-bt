import { tenant } from "../db/models";

import { createProject, createStage, createStep, createStepDetails, getStageType, getStepType, isProjectExist, updateProjectStage } from "../db/adminDbFunctions";
import { ProjectStage, ProjectStatusEnum, ProjectType } from "@prisma/client";
import { addReferencesLambda } from "../knowledgebase/commonFunctions";
import { hashing, hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables
const BedRockDataSourceS3 = process.env.BEDROCK_DATASOURCE_S3 || "";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addProjectAndReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.projectType,
      event.arguments?.input?.organizationId,
      event.arguments?.input?.files
    );
    console.log("data", data);

    const response = {
      status: data.project != null ? 200 : 400,
      data: data.project,
      error: data.error
    };
    console.log("project", response);

    return response;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function addProjectAndReference(
  tenant: tenant,
  name: string,
  description: string,
  projectType: ProjectType,
  organizationId: string,
  files: any
) {
  console.log("Creating admin project");

  try {
    console.log("project", tenant.id, projectType);

    const isExist = await isProjectExist(projectType, name, organizationId);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const project = await createProject(tenant, name, description, projectType, organizationId, kb_id);
    let datasource_id = BedRockDataSourceS3;

    if (project != null) {

     const stage1 = await addStage_1(tenant.adminuserid??"", project.id, files);
      await addReferencesLambda(tenant.adminuserid??"", project.id);

      return {
        project: project,
        error: null
      };
    } else {
      return {
        project: null,
        error: "Project not created"
      };
    }
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      project: null,
      error: e
    };
  }
}

export async function addStage_1(tenantUserId: string, projectId: string, files: any) {
   // Stage 1: Data Source
   const stageType = await getStageType("Data Source");
   if (stageType) {
     const stage1 = await createStage(tenantUserId, "Data Source", "Data Source", stageType.id, projectId,1);
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
           createStep(tenantUserId, "File upload from frontend", "File upload from frontend", stepType1.id, stage1.id,1),
           createStep(tenantUserId, "File hashing", "File hashing", stepType2.id, stage1.id,2),
           createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage1.id,3)
         ]);

         for (const file of files) {
           const fileData = { fileName: file.fileName, fileContent: file.fileContent };

           // Step 1: File upload details
           await createStepDetails(tenantUserId, JSON.stringify(fileData), step1.id);

           // Step 2: Hash the file data
           const hash = await hashing(fileData);
           const hashedData = {
             "hash": hash.data?.dataHash,
           }
           await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id);

           // Step 3: Store the hashed data on the blockchain
           const blockchainHashedData = await hashingAndStoreToBlockchain(fileData, false);
           await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
         }

         // Update project to reflect data ingestion status
         await updateProjectStage(projectId, ProjectStage.DATA_INGESTION, ProjectStatusEnum.ACTIVE);
       }
     }
   }
}
