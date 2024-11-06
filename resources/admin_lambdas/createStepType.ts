import { tenant } from "../db/models";
import {  createStage, createStepType, isStageExist, isStepExist, isStepTypeExist } from "../db/adminDbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addStepType(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description

    );
    console.log("data", data);

    const response = {
      status: data.steptype != null ? 200 : 400,
      data: data.steptype,
      error: data.error
    };
    console.log("steptype", response);

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

async function addStepType(tenant: tenant, name: string, description: string) {
  console.log("Creating admin steptype");

  try {
    console.log("steptype", tenant.id);

    const isExist = await isStepTypeExist( name);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const steptype = await createStepType(tenant, name, description);

    return {
      steptype: steptype,
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
