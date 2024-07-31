import { CustomerAndWalletCounts } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const wallets = await CustomerAndWalletCounts(event.identity.resolverContext as tenant);
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



