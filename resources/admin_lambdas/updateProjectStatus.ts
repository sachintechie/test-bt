import { tenant } from "../db/models";

import {
  getProjectById,
  updateReferenceStatusByAdmin,
} from "../db/adminDbFunctions";
import { addAllStageLambda, addReferencesLambda, addStage1Lambda } from "../knowledgebase/commonFunctions";
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




