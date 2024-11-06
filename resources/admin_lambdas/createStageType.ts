import { tenant } from "../db/models";
import {  createStageType, isStageTypeExist } from "../db/adminDbFunctions";

const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addStageType(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description
    );
    console.log("data", data);

    const response = {
      status: data.stageType != null ? 200 : 400,
      data: data.stageType,
      error: data.error
    };
    console.log("stageType", response);

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

async function addStageType(tenant: tenant, name: string, description: string) {
  console.log("Creating admin stageType");

  try {
    console.log("stageType", tenant.id);

    const isExist = await isStageTypeExist( name);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const stageType = await createStageType(tenant, name, description);

    return {
      stageType: stageType,
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
