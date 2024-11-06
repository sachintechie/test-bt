import { tenant } from "../db/models";
import {   createStep, isStepExist } from "../db/adminDbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addStep(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.stepTypeId,
      event.arguments?.input?.stageId,
    );
    console.log("data", data);

    const response = {
      status: data.step != null ? 200 : 400,
      data: data.step,
      error: data.error
    };
    console.log("step", response);

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

async function addStep(tenant: tenant, name: string, description: string,stepTypeId:string,stageId:string) {
  console.log("Creating admin step");

  try {
    console.log("step", tenant.id);

    const isExist = await isStepExist( name);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const step = await createStep(tenant, name, description,stepTypeId,stageId);

    return {
      step: step,
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
