import { tenant } from "../db/models";
import { deleteProductAttributes, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;
    const { productId, attributeIds } = event.arguments?.input;

    if (!productId || !attributeIds || !Array.isArray(attributeIds) || attributeIds.length === 0) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }
    const adminUser = await getAdminUserById(tenant.adminuserid!);
    console.log("adminUser", adminUser);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    console.log("customer", customer);
    const customerId  = customer.id
    const result = await deleteProductAttributes(productId, attributeIds, customerId);
    console.log(result);

    return {
      status: 200,
      data: `Successfully deleted ${result.count} attributes`,
      error: null
    };
  } catch (error) {
    console.error("Error deleting attributes:", error);
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
