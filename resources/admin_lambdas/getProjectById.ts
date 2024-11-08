import { getAdminTransactionsById, getProjectByIdWithRef, getProjectWithSteps } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const data = await getProject(event.identity.resolverContext as tenant, event.arguments?.input?.projectId,
      event.arguments.input.limit, event.arguments.input.pageNo
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

async function getProject(tenant: tenant, projectId: string, limit: number, pageNo: number) {
  console.log("projectId", projectId);

  try {
    const project = await getProjectWithSteps(projectId, limit,pageNo);
    if(project.error){
      return {
        project: null,
        error: project.error
      };
    }
    else{
      return {
        project: project.data?.project,
        error: null
      };
    }
 
  } catch (err) {
    console.log(err);
    return{
      project: null,
      error: err
    }
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
