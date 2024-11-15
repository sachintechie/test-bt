import { tenant } from "../db/models";
import { deleteProduct, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;
    const productId  = event.arguments?.input?.productId;

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Product ID is required"
      };
    }

    const adminUser = await getAdminUserById(tenant.adminuserid!);
    console.log("adminUser", adminUser);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    console.log("customer", customer);
    const customerId  = customer.id

    const deletedProduct = await deleteProduct(productId, customerId);

    return {
      status: 200,
      data: deletedProduct,
      error: null
    };
  } catch (error) {
    console.error("Error deleting product", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error:errorMessage,
    };
  }
};
