import { RefType, tenant } from "../db/models";
import { addReferenceToDb } from "../db/adminDbFunctions";
import { ReferenceStatus } from "@prisma/client";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addFileToProject(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.projectId,
      event.arguments?.input?.files
    );

    const response = {
      status: data.document != null ? 200 : 400,
      data: data.document,
      error: data.error
    };
    console.log("document", response);

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

async function addFileToProject(tenant: tenant, projectId: string, files: any) {
  console.log("Creating admin user");
  try {
    const refs = [];

    console.log("createUser", tenant.id);
    for (const file of files) {
      file.refType = RefType.DOCUMENT;
      const ref = await addReferenceToDb(tenant.id, file, false, projectId, ReferenceStatus.PENDING,tenant?.customerid ?? "");
      console.log("ref", ref);
      if (ref.data) refs.push(ref.data);
    }

    return {
      document: refs,
      error: null
    };
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      document: null,
      error: e
    };
  }
}
