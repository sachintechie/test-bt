import { updateProductStatus, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, status } = event.arguments?.input;
    const tenant = event.identity?.resolverContext as tenant;

    if (!productId || !status) {
      return {
        status: 400,
        data: null,
        error: "Product ID and status is required"
      };
    }

    const adminUser = await getAdminUserById(tenant.adminuserid!);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    const updatedStatus = await updateProductStatus(productId, status, customer.id);

    return {
      status: 200,
      data: updatedStatus,
      error: null
    };
  } catch (error) {
    console.error("Error updating product status:", error);
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
