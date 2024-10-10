import { getAdminTransactionsByWalletAddress, getAdminUsers, getReferenceList } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const tokens = await getRefs(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.limit,
      event.arguments?.input?.pageNo,
      event.arguments?.input?.refType,

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

async function getRefs(tenant: tenant, limit: number, pageNo: number,refType: string) {
  try {
    const refs = await getReferenceList(limit, pageNo,tenant.id, refType);
    console.log(refs, "refs");
    return refs;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
