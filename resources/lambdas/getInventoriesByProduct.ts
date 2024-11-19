import { tenant } from "../db/models";
import { getInventoriesByProductId } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event);

    const tenant = event.identity.resolverContext as tenant;

    if (!tenant) {
      return {
        status: 400,
        data: null,
        error: "Tenant ID must be provided."
      };
    }

    const { productId, page, perPage } = event.arguments?.input || {};

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: productId is required"
      };
    }

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    const offset = (currentPage - 1) * itemsPerPage;

    
    const { inventory, totalCount } = await getInventoriesByProductId(offset, itemsPerPage,tenant.id, productId);

    if (!inventory || inventory.length === 0) {
      return {
        status: 404,
        data: null,
        error: "No inventory found for the provided productId"
      };
    }

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: inventory, 
      page: currentPage,
      perPage: itemsPerPage,
      totalRecordsCount: totalCount, 
      totalPageCount: totalPages, 
      error: null
    };
  } catch (error) {
    console.error("Error fetching inventory by productId:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error: errorMessage
    };
  }
};
