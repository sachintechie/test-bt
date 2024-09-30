import { getOrdersByTenant } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { tenantId } = event.arguments?.input;

    if (!tenantId) {
      return {
        status: 400,
        data: null,
        error: "Tenant ID must be provided."
      };
    }

    const orders = await getOrdersByTenant(tenantId);

    return {
      status: 200,
      data: orders,
      error: null
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
