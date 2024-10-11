import { getWishlistByCustomerId } from "../db/dbFunctions";
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

    const { page, perPage } = event.arguments?.input || {};

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    const offset = (currentPage - 1) * itemsPerPage;

    const { wishlistItems, totalCount } = await getWishlistByCustomerId(customerId, offset, itemsPerPage);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: wishlistItems,
      page: currentPage,
      perPage: itemsPerPage,
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
