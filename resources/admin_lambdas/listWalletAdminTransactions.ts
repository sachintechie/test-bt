import { getAdminTransactionsByWalletAddress } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const tokens = await getTransactions(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.walletAddress,
      event.arguments?.input?.limit,
      event.arguments?.input?.pageNo
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

async function getTransactions(tenant: tenant, walletAddress: string, limit: number, pageNo: number) {
  console.log("Wallet Address", walletAddress);

  try {
    const wallet = await getAdminTransactionsByWalletAddress(walletAddress, tenant, limit, pageNo, "");
    console.log(wallet, "Wallet");
    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
