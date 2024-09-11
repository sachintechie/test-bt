import { tenant } from "../db/models";
import { createCategory} from "../db/dbFunctions"; // Assuming you have a function to create a category in your DB
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { categoryName } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!categoryName) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const category = await createCategoryInDb(tenantContext, categoryName);

    return {
      status: 200,
      data: category,
      error: null
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      status: 500,
      data: null,
      error: error
    };
  }
};

async function createCategoryInDb(tenant: tenant, categoryName: string ) {
      const newCategory = await createCategory({ tenantid: tenant.id, name: categoryName });
      return newCategory;

}