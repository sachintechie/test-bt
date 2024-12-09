import {
  createStage,
  createStep,
  createStepDetails,
  getProjectById,
  getReferenceByProjectId,
  getStageType,
  getStepType,
  updateProjectKbAndIndex,
  updateProjectKbBucket,
  updateProjectStage,
  updateReferenceStage
} from "../db/adminDbFunctions";
import { ProjectStage, ProjectStatusEnum, ReferenceStage, ReferenceStatus } from "@prisma/client";
import {  storeHashByChainType, generateSignedUrl, lambdaCallForCreateKB, generateRandomString, lambdaCallForCreateS3Bucket, addReferencesLambda } from "../knowledgebase/commonFunctions";
import { RefType } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId,bucketName,projectName } = event;

    // Calls function to handle adding stages and steps for file processing
    const data = await addStage_1(tenantUserId, projectId,bucketName,projectName);

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

export async function addStage_1( tenantUserId: string, projectId: string,bucketName:string,projectName:string) {
  // Stage 1: Data Source
  const refIds : string[]= [];
  const stageType = await getStageType("Data Source");
  const project = await getProjectById(projectId);

  if(project != null && project.data){
    let sanitizedName: string = project.data.name
    .replace(/[^a-z0-9-]/g, '')   // Remove invalid characters
    .replace(/^-+/, '')           // Remove leading hyphens
    .replace(/^[^a-z0-9]/, 'a');  // Ensure it starts with a lowercase letter or alphanumeric

  let randomString: string = await generateRandomString(6); // Generate a 6-character random string
  let finalName: string = `${sanitizedName}-${randomString}`;
  const kbResponse = await lambdaCallForCreateKB( project.data.id,finalName);
  if (project != null && kbResponse && kbResponse.data != null) {
    

   const updateProject = await updateProjectKbAndIndex(project.data.id, kbResponse.data.Kb_Id ?? "",
     kbResponse?.data.Index_Name ?? "",kbResponse?.data.Collection_Name ?? "");
    console.log("updateProjectKB", updateProject);
  }

  }


  // let sanitizedName: string = projectName
  //   .replace(/[^a-z0-9-]/g, '')  // Remove invalid characters
  //   .replace(/^[^a-z]/, 'a');    // Ensure it starts with a lowercase letter
  
  // let randomString: string = await generateRandomString(6); // Generate a 6-character random string
  // let finalName: string = `${sanitizedName}-${randomString}`;
  // console.log(finalName); 
  // const kbResponse = await lambdaCallForCreateKB( projectId,finalName);
  //   console.log("kbResponse", kbResponse);
  // const updateProject = await updateProjectKbAndIndex(projectId, kbResponse.data.Kb_Id ?? "", kbResponse?.data.Index_Name ?? "");
  // console.log("updateProject", updateProject);
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

        const referenceList = await getReferenceByProjectId(projectId, ReferenceStage.DATA_SOURCE,ReferenceStatus.PENDING);

        for (const ref of referenceList) {
         // file.refType = RefType.DOCUMENT;
        
          if(ref?.id && ref?.name &&ref.reftype == RefType.DOCUMENT){
      

          console.log("ref", ref);
          // const fileSize = await getFileSizeFromBase64(file.fileContent)
         const  downloadUrl = await generateSignedUrl(ref?.name ?? "",bucketName);
         refIds.push(ref?.id);

          const fileData = { fileName: ref.name, contentType: ref.contenttype, size: ref.size,downloadUrl:downloadUrl };
          // Step 1: File upload details
          await createStepDetails(tenantUserId, JSON.stringify(fileData), step1.id,ref.id);

          // Step 2: Hash the file data
          const hashedData = {
            hash: ref.hash
          };
          await createStepDetails(tenantUserId, JSON.stringify(hashedData), step2.id,ref.id);

          // Step 3: Store the hashed data on the blockchain
          const blockchainHashedData = await storeHashByChainType(ref?.hash?? "", project.data?.chaintype ?? "");
          if(blockchainHashedData != null)
          await createStepDetails(tenantUserId, JSON.stringify(blockchainHashedData.data), step3.id,ref.id);

          }
          else{
            console.log("Reference not found");
            return false;
          }

        
      }

      await addReferencesLambda(tenantUserId, projectId,bucketName);
        // Update project to reflect data ingestion status
        await updateProjectStage(projectId, ProjectStage.DATA_SOURCE, ProjectStatusEnum.ACTIVE);
        await updateReferenceStage(projectId, refIds,ReferenceStage.DATA_SOURCE,ReferenceStatus.PROCESSING);

        return true;

      }
    }
  }

  return true;
}




