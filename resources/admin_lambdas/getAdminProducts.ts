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
    const products = await getAdminProductsByTenantId(tenant.id);

    return {
      status: 200,
      data: products,
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
