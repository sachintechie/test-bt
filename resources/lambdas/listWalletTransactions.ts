import { getTransactionsByWalletAddress, getWalletAndTokenByWalletAddress } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const tokens = await getTransactions(event.identity.resolverContext as tenant, event.arguments?.input?.walletAddress);
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

async function getTransactions(tenant: tenant, walletAddress: string) {
  console.log("Wallet Address", walletAddress);

  try {
    const wallet = await getTransactionsByWalletAddress(walletAddress, tenant, "");
    console.log(wallet, "Wallet");
    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
