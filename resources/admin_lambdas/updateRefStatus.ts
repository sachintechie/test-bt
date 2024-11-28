import { tenant } from "../db/models";

import {
  getRefById,
  updateRefStatus,
} from "../db/adminDbFunctions";
import { ReferenceStatus } from "@prisma/client";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await updateReferenceStatus(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.refId,
      event.arguments?.input?.status
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

async function updateReferenceStatus(tenant: tenant, refId: string,status : ReferenceStatus) {

  try {
    console.log("ref", tenant.id, refId);

    const refData = await getRefById(refId);
    if (refData.data == null) {
      return {
        project: null,
        error: "Reference not found"
      };
    } else {
        const ref = await updateRefStatus(refId,status)
    
      return {
        project: ref,
        error: null
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




