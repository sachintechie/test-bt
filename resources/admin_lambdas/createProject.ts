import { tenant } from "../db/models";
import { createProject, isProjectExist } from "../db/adminDbFunctions";
import { ProjectType } from "@prisma/client";
const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addProject(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.projectType,
      event.arguments?.input?.organizationId
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

async function addProject(tenant: tenant, name: string, description: string, projectType: ProjectType, organizationId: string) {
  console.log("Creating admin project");

  try {
    console.log("project", tenant.id, projectType);

    const isRefExist = await isProjectExist(projectType, name, organizationId);
    if (isRefExist.isExist) {
      return {
        project: null,
        error: isRefExist.error
      };
    }

    const project = await createProject(tenant, name, description, projectType, organizationId, kb_id);

    return {
      project: project,
      error: null
    };
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      project: null,
      error: e
    };
  }
}
