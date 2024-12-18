import { tenant } from "../db/models";
import { createProductAttributes, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;
    const { productId, data } = event.arguments?.input;

    if (!productId || !data || !Array.isArray(data) || data.length === 0) {
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
    const customerId = customer.id;
    const attributes = data.map(({ key, value, type }) => ({
      key,
      value,
      type,
      productid: productId,
      customerid: customerId
    }));

    const result = await createProductAttributes(attributes);
    console.log(result);

    return {
      status: 200,
      data: `Successfully created ${result.count} attributes`,
      error: null
    };
  } catch (error) {
    console.error("Error creating attribute:", error);
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
