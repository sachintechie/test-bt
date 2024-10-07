import { getCollectionByCustomerId } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    const tenant = event.identity.resolverContext as tenant;
    console.log(event, tenant, event.identity);

    const customerId = event.arguments?.input?.customerId;
    const collection = await getCollectionByCustomerId(customerId);
    return {
      status: 200,
      data: collection,
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
