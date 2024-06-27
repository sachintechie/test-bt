import { getCustomerWalletsByCustomerId } from "./db/dbFunctions";
import { tenant } from "./db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const wallets = await listCustomerWallets(event.identity.resolverContext as tenant, event.arguments?.input?.customerId);
    return {
      status: 200,
      data: wallets,
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

async function listCustomerWallets(tenant: tenant, customerId: string) {
  console.log("customerId", customerId);

  try {
    const wallet = await getCustomerWalletsByCustomerId(customerId, tenant);
    console.log(wallet, "Wallet");
    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
