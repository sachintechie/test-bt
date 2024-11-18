import { tenant } from "../db/models";
import { getCategoryById,getCustomer} from "../db/dbFunctions";
import { updateCategory,getAdminUserById } from "../db/adminDbFunctions";
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { categoryId, categoryName } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!categoryId || !categoryName) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const existingCategory = await getCategoryById(categoryId);

    if (!existingCategory || existingCategory.tenantid !== tenantContext.id) {
      return {
        status: 403,
        data: null,
        error: "Unauthorized: Tenant mismatch"
      };
    }
	const adminUser = await getAdminUserById(tenantContext.adminuserid!);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenantContext.id!);
    const updatedCategory = await updateCategoryInDb(categoryId, categoryName, customer.id);

    return {
      status: 200,
      data: updatedCategory,
      error: null
    };
  } catch (error) {
    console.error("Error updating category:", error);
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

async function updateCategoryInDb(categoryId: string, categoryName: string, customerId:string) {
  const updatedCategory = await updateCategory(categoryId, categoryName, customerId);
  return updatedCategory;
}
