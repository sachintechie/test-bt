import { getProjectList } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const projects = await getProjects(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.limit,
      event.arguments?.input?.pageNo,
      event.arguments?.input?.organizationId
    );
    return {
      status: 200,
      data: projects,
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function getProjects(tenant: tenant, limit: number, pageNo: number, organizationId: string) {
  try {
    const projects = await getProjectList(limit, pageNo, organizationId);
    console.log(projects, "projects");
    return projects;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
