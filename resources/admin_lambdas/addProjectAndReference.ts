import { RefType, tenant } from "../db/models";
import {
  addReferenceToDb,
  createProject,
  createStage,
  createStep,
  createStepDetails,
  getProjectWithSteps,
  getStageType,
  getStepType,
  isProjectExist,
  updateProjectKbAndIndex,
  updateProjectStage,
  updateReferenceStage
} from "../db/adminDbFunctions";
import { ProjectStage, ProjectStatusEnum, ProjectType, ReferenceStage, ReferenceStatus } from "@prisma/client";
import {  formatBytes, generatePresignedUrl, generateSignedUrl, lambdaCallForCreateKB, storeHashByChainType } from "../knowledgebase/commonFunctions";
import { logWithTrace } from "../utils/utils";
// const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables

export const handler = async (event: any, context: any) => {
  try {

    logWithTrace(event, context);

    const data = await addProjectAndReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.projectType,
      event.arguments?.input?.organizationId,
      event.arguments?.input?.chainType,
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
    logWithTrace("In catch Block Error", err);
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
  chainType: string,
  files: any
) {
  logWithTrace("Creating admin project");

  try {
    logWithTrace("project", tenant.id, projectType);

    const isExist = await isProjectExist(projectType, name, organizationId);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const project = await createProject(tenant, name, description, projectType,chainType, organizationId);
    const kbResponse = await lambdaCallForCreateKB( project.id,name);
    console.log("kbResponse", kbResponse);


    if (project != null && kbResponse != null) {
      const updateProject = await updateProjectKbAndIndex(project.id, kbResponse?.Kb_Id ?? "", kbResponse?.Index_Name ?? "", kbResponse?.s3_bucket ?? "");
      console.log("updateProject", updateProject);
      const stage1 = await addStage_1(tenant.id,tenant.adminuserid ?? "", project.id, files);
      console.log("stage1", stage1);
      const urls = await generatePresignedUrl(files);
      console.log("urls", urls);
      var projectData = await getProjectWithSteps(project.id, 1, 1);
      if (projectData.error) {
        return {
          project: null,
          error: projectData.error
        };
      } else {

        const data = {
          project: projectData.data?.project,
          urls: urls
        }

        return {

          project: data,
          error: null
        };
      }
      // await addReferencesLambda(tenant.adminuserid??"", project.id);
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

export async function addStage_1(tenantId: string, tenantUserId: string, projectId: string, files: any) {
  // Stage 1: Data Source
  const refIds : string[]= [];
  const stageType = await getStageType("Data Source");
  if (stageType) {
    const stage1 = await createStage(tenantUserId, "Data Source", "Data Source", stageType.id, projectId, 1);
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
          createStep(tenantUserId, "File upload from frontend", "File upload from frontend", stepType1.id, stage1.id, 1),
          createStep(tenantUserId, "File hashing", "File hashing", stepType2.id, stage1.id, 2),
          createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage1.id, 3)
        ]);

        for (const file of files) {
          file.refType = RefType.DOCUMENT;
          const ref = await addReferenceToDb(
            tenantId,
            file,
            false,
            projectId,
            ReferenceStatus.PROCESSING,
            tenantUserId
          );
          if(ref.data?.id)
          refIds.push(ref.data?.id);

          console.log("ref", ref);
          // const fileSize = await getFileSizeFromBase64(file.fileContent)
          const downloadUrl = await generateSignedUrl(file);

          const fileData = { fileName: file.fileName, contentType: file.contentType, size: file.fileSize,downloadUrl:downloadUrl };
          // Step 1: File upload details
          await createStepDetails(tenantUserId, JSON.stringify(fileData), step1.id);

          // Step 2: Hash the file data
          const hashedData = {
            hash: file.hash
          };
          await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id);

          // Step 3: Store the hashed data on the blockchain
          const blockchainHashedData = await storeHashByChainType(file.hash, "Avalanche");
          if(blockchainHashedData != null)
          await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id);
        }

        // Update project to reflect data ingestion status
        await updateProjectStage(projectId, ProjectStage.DATA_SOURCE, ProjectStatusEnum.ACTIVE);
        await updateReferenceStage(projectId, refIds,ReferenceStage.DATA_SOURCE,ReferenceStatus.PROCESSING);
      }
    }
  }
}

async function getFileSizeFromBase64(base64String: string) {
  // Calculate the file size in bytes
  const fileSizeInBytes = (base64String.length * 3) / 4 - (base64String.endsWith("==") ? 2 : base64String.endsWith("=") ? 1 : 0);
  const size = await formatBytes(fileSizeInBytes);
  return size;
}
