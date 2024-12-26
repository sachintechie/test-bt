import {  getRefsByWebRef } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const data = await getRefsByWebRefId(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.refId
    );
    const projectData = {
      status: data.project != null ? 200 : 400,
      data: data.project,
      error: data.project == null ? data.error : null
    };

    console.log("project", projectData);

    return projectData;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function getRefsByWebRefId(tenant: tenant, refId: string) {
  console.log("projectId", refId);

  try {
    const project = await getRefsByWebRef(refId);
    if (project.error) {
      return {
        project: null,
        error: project.error
      };
    } else {
      return {
        project: project.data,
        error: null
      };
    }
  } catch (err) {
    console.log(err);
    return {
      project: null,
      error: err
    };
  }
}

// async function getProject(tenant: tenant, projectId: string, limit: number, pageNo: number) {
//   console.log("projectId", projectId);

//   try {
//    const project = await getProjectByIdWithRef(projectId, limit,pageNo);
//     if(project.error){
//       return {
//         project: null,
//         error: project.error
//       };
//     }
//     else{
//       return {
//         project: project.data,
//         error: null
//       };
//     }

//   } catch (err) {
//     console.log(err);
//     return{
//       project: null,
//       error: err
//     }
//   }
// }
