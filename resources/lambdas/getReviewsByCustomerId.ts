import { getReviewsByCustomerId } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any) => {
  try {
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;

    if (!customerId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID must be provided."
      };
    }
    const review = await getReviewsByCustomerId(customerId);
    return {
      status: 200,
      data: review,
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
