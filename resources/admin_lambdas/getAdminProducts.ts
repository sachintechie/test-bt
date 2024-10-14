import { getAdminProductsByTenantId } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;

    if (!tenant) {
      return {
        status: 400,
        data: null,
        error: "Tenant ID must be provided."
      };
    }

    const { page, perPage } = event.arguments?.input || {};

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    const offset = (currentPage - 1) * itemsPerPage;

    const { products, totalCount } = await getAdminProductsByTenantId(offset, itemsPerPage, tenant.id);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: products,
      page: currentPage,
      perPage: itemsPerPage,
      totalRecordsCount: totalCount,
      totalPageCount: totalPages,
      error: null
    };
  } catch (error) {
    console.error("Error fetching products:", error);
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
