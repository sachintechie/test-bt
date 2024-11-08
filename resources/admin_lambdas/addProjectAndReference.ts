import { tenant } from "../db/models";

import { createProject, isProjectExist } from "../db/adminDbFunctions";
import { ProjectType } from "@prisma/client";
import { addReferencesLambda } from "../knowledgebase/commonFunctions";
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
      await addReferencesLambda(tenant.id, project.id, files, datasource_id);

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
