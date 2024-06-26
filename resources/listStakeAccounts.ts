import { getStakeAccounts } from "./db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const accounts = await getStakeAccounts(event.arguments?.input?.walletAddress, event.identity.resolverContext.id);
    return {
      status: 200,
      data: accounts,
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
