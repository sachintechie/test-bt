import {  getListOfStageTypeAndStepType } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const tokens = await getData(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.limit,
      event.arguments?.input?.pageNo,
      event.arguments?.input?.type

    );
    return {
      status: 200,
      data: tokens,
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

async function getData(tenant: tenant, limit: number, pageNo: number,type: string) {
  try {
    const refs = await getListOfStageTypeAndStepType(limit, pageNo,tenant.id, type);
    console.log(refs, "refs");
    return refs;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
