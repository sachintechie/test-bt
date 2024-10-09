import { getWishlistByCustomerId } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
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

    const wishlistItems = await getWishlistByCustomerId(customerId);

    return {
      status: 200,
      data: wishlistItems,
      error: null
    };
  } catch (error) {
    console.error("Error getting wishlist items:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
