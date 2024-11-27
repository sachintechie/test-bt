import { tenant } from "../db/models";
import {
  updateReferenceStatus,
  updateReferenceStatusByAdmin,
} from "../db/adminDbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await updateRefStatus(
      event.identity.resolverContext as tenant,
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

async function updateRefStatus(tenant: tenant,  files: any) {
  console.log("Creating admin project");

  try {
    console.log("project", tenant.id, files);


    const refs = await updateReferenceStatusByAdmin( files);

if(refs != null){
  return {
    project: refs,
    error: null
  };
}
else{
  return {
    project: null,
    error: "Error updating reference status"
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




