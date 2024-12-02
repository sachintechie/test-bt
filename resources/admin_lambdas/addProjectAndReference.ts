import { RefType, tenant } from "../db/models";
import {
  addReferences,
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
import {  addReferencesLambda, addStage1Lambda, formatBytes, generatePresignedUrl, generateRandomString, generateSignedUrl, lambdaCallForCreateKB, storeHashByChainType } from "../knowledgebase/commonFunctions";
import { logWithTrace } from "../utils/utils";

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
    console.log("data", JSON.stringify( data));

    const response = {
      status: data.project != null ? 200 : 400,
      data: {
        project: data.project?.data,
        urls: data.project?.urls
      },
      error: data.error
    };
    console.log("project", JSON.stringify(response));

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
    let sanitizedName: string = name
    .replace(/[^a-z0-9-]/g, '')  // Remove invalid characters
    .replace(/^[^a-z]/, 'a');    // Ensure it starts with a lowercase letter
  
  let randomString: string = await generateRandomString(6); // Generate a 6-character random string
  let finalName: string = `${sanitizedName}-${randomString}`;
  console.log(finalName); // Output: "bridgetower-testptoject121-abc123"
    const kbResponse = await lambdaCallForCreateKB( project.id,finalName);
    console.log("kbResponse", kbResponse);


    if (project != null && kbResponse && kbResponse.data != null) {
      const updateProject = await updateProjectKbAndIndex(project.id, kbResponse.data.Kb_Id ?? "", kbResponse?.data.Index_Name ?? "", kbResponse?.data.s3_bucket ?? "");
      console.log("updateProject", updateProject);
      const refs = await addReferences(tenant.id, tenant.adminuserid ?? "", project.id, files,kbResponse.data.s3_bucket);
    //  const stage1 = await addStage_1(tenant.id,tenant.adminuserid ?? "", project.id, files,kbResponse.data.s3_bucket);
     // console.log("stage1", stage1);
      const generatedUrls = await generatePresignedUrl(files.filter((file: any) => file.refType === RefType.DOCUMENT), kbResponse.data.s3_bucket);
      console.log("generatedUrls", generatedUrls);
      await addStage1Lambda(tenant.adminuserid ?? "", project.id,kbResponse.data.s3_bucket);

     // var projectData = await getProjectWithSteps(project.id, 1, 1);
     // console.log("projectData", projectData);
      if (updateProject == null ) {
        return {
          project: null,
          error: "Not able to update project"
        };
      } else {
        const data = {
          data: updateProject,
          urls: generatedUrls
        }
        console.log("final-data", JSON.stringify(data));
        return {
          project: data,
          error: null
        };
      }
    } else {
      return {
        project: null,
        error: kbResponse.error
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


 



async function getFileSizeFromBase64(base64String: string) {
  // Calculate the file size in bytes
  const fileSizeInBytes = (base64String.length * 3) / 4 - (base64String.endsWith("==") ? 2 : base64String.endsWith("=") ? 1 : 0);
  const size = await formatBytes(fileSizeInBytes);
  return size;
}
