import { tenant } from "../db/models";
import { deleteCategory, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;
    const categoryId = event.arguments?.input?.categoryId;

    if (!categoryId) {
      return {
        status: 400,
        data: null,
        error: "Category ID is required"
      };
    }

    const adminUser = await getAdminUserById(tenant.adminuserid!);
    console.log("adminUser", adminUser);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    console.log("customer", customer);
    const customerId = customer.id;

    const deletedCategory = await deleteCategory(categoryId, customerId);

    return {
      status: 200,
      data: deletedCategory,
      error: null
    };
  } catch (error) {
    console.error("Error deleting category", error);
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
