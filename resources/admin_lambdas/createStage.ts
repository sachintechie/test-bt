import { tenant } from "../db/models";
import {  createStage, isStageExist } from "../db/adminDbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addStage(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.stageTypeId,
      event.arguments?.input?.projectId

    );
    console.log("data", data);

    const response = {
      status: data.stage != null ? 200 : 400,
      data: data.stage,
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

async function addStage(tenant: tenant, name: string, description: string,stageTypeId:string,projectId:string) {
  console.log("Creating admin addStage");

  try {
    console.log("stage", tenant.id);

    const isExist = await isStageExist( name);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const stage = await createStage(tenant.adminuserid??"", name, description,stageTypeId,projectId );

    return {
      stage: stage,
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
