import { getAdminTransactionsByWalletAddress } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const tokens = await getTransactions(event.identity.resolverContext as tenant, event.arguments?.input?.tenantTransactionId);
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

async function getTransactions(tenant: tenant, tenantTransactionId: string) {
  console.log("tenantTransactionId", tenantTransactionId);

  try {
    const wallet = await getAdminTransactionsByWalletAddress(tenantTransactionId, tenant, "");
    console.log(wallet, "Wallet");
    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
