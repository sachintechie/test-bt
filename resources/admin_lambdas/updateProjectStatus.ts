import { tenant } from "../db/models";

import {
  getProjectById,
  updateProjectKbAndIndex,
  updateReferenceStatusByAdmin,
} from "../db/adminDbFunctions";
import { addAllStageLambda, addReferencesLambda, addStage1Lambda, generateRandomString, lambdaCallForCreateKB } from "../knowledgebase/commonFunctions";
import { ProjectStage } from "@prisma/client";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await updateProjectStatus(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.projectId,
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

async function updateProjectStatus(tenant: tenant, projectId: string, files: any) {
  console.log("Creating admin project");

  try {
    console.log("project", tenant.id, projectId, files);

    const project = await getProjectById(projectId);
    if (project.data == null) {
      return {
        project: null,
        error: "Project not found"
      };
    } else {
      if(project.data.projectstage === ProjectStage.DATA_SOURCE){
        const refs = await updateReferenceStatusByAdmin(files);

        
  if(project != null && project.data  && project.data.knowledgebaseid == null){
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

       // await addStage1Lambda(tenant.adminuserid ?? "", project.data.id,project.data.s3bucketname?? "",project.data.name);
        await addAllStageLambda(
          tenant.adminuserid ?? "",
          project.data.id,
          project.data?.s3bucketname ?? "",
          project.data?.name ?? ""
        );
      }
      return {
        project: project.data,
        error: null
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




