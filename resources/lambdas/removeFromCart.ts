import { removeFromCart } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const { inventoryId } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;

    // Validate required fields
    if (!customerId || !inventoryId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID and Inventory ID must be provided.",
      };
    }

    // Remove product from cart
    const result = await removeFromCart(customerId, inventoryId);

    return {
      status: 200,
      data: result,
      error: null,
    };
  } catch (error) {
    console.error("Error removing item from cart:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error: errorMessage,
    };
  }
};
