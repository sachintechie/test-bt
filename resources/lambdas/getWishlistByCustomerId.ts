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

    const { page = 1, perPage = 10 } = event.arguments?.input || {};
    const offset = (page - 1) * perPage;

    const { wishlistItems, totalCount } = await getWishlistByCustomerId(customerId, offset, perPage);

    const totalPages = Math.ceil(totalCount / perPage);

    return {
      status: 200,
      data: wishlistItems,
      page,
      perPage,
      totalRecordsCount: totalCount,
      totalPageCount: totalPages,
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
