import { tenant } from "../db/models";
import { getInventoryByProductId } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event,);

    const { productId } = event.arguments?.input;

  const tenant = event.identity.resolverContext as tenant;

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: productId is required"
      };
    }

    const inventory = await getInventoryByProductId(tenant.id, productId);

    if (!inventory) {
      return {
        status: 404,
        data: null,
        error: "No inventory found for the provided productId"
      };
    }

    return {
      status: 200,
      data: inventory,
      error: null
    };
  } catch (error) {
    console.error("Error fetching inventory by productId:", error);
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


