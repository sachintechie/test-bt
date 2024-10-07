import { getCollectionByCustomerId } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    const tenant = event.identity.resolverContext as tenant;
    console.log(tenant, tenant?.customerid);

    const customerId = tenant?.customerid;
    const collection = await getCollectionByCustomerId(customerId);
    return {
      status: 200,
      data: collection,
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    let errorMessage = "An unknown error occurred.";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return {
      status: 400,
      data: null,
      error: errorMessage
    };
  }
};
