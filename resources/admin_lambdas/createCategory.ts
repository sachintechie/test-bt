import { tenant } from "../db/models";
import { createCategory,getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";
export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event, "context", context);
	  const tenant = event.identity?.resolverContext as tenant;

    const { categoryName } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    console.log("tenantContext", tenantContext);

    if (!categoryName) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const adminUser = await getAdminUserById(tenant.adminuserid!);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    const category = await createCategoryInDb(tenantContext, categoryName, customer.id);

    return {
      status: 200,
      data: category,
      error: null
    };
  } catch (error) {
    console.error("Error creating category:", error);
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

async function createCategoryInDb(tenant: tenant, categoryName: string, customerId:string) {
  const newCategory = await createCategory({ tenantid: tenant.id, name: categoryName , customerid:customerId });
  return newCategory;
}
