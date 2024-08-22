import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { createCategory } from "../db/dbFunctions"; // Assuming you have a function to create a category in your DB

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { tenantUserId, categoryName } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!tenantUserId || !categoryName) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const category = await createCategoryInDb(tenantContext, tenantUserId, categoryName);

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

async function createCategoryInDb(tenant: tenant, tenantUserId: string, categoryName: string) {
  // Logic to create the category in the database
  const newCategory = await createCategory({ tenantId: tenant.id, name: categoryName });

  // Save to DB
  return newCategory;
}
