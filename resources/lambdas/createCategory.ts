import { tenant } from "../db/models";
import { createCategory, getAdminUser} from "../db/dbFunctions"; // Assuming you have a function to create a category in your DB
import { verifyToken } from "../cognito/commonFunctions"
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

    const category = await createCategoryInDb(tenantContext, event.headers?.identity, tenantUserId, categoryName);

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

async function createCategoryInDb(tenant: tenant, oidcToken: string, tenantUserId: string, categoryName: string ) {
  const admin = await getAdminUser(tenantUserId, tenant.id);
  if (admin != null && admin?.cubistuserid) {
    return { admin, error: null };
  } else {
    if (!oidcToken) {
      return {
        admin: null,
        error: "Please provide an identity token for verification"
      };
    } else {
      const verification = await verifyToken(tenant,oidcToken);
      if(!verification) throw new Error (`Admin veification failed`)
      const newCategory = await createCategory({ tenantid: tenant.id, name: categoryName });
      return newCategory;
    }
  }
}