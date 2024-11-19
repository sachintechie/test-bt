import { addToCart } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const { inventoryId, quantity } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;

    if (!customerId || !inventoryId || !quantity) {
      return {
        status: 400,
        data: null,
        error: "Customer ID, Inventory ID, and Quantity must be provided."
      };
    }
    const newCartItem = await addToCart({ buyerid: customerId, inventoryid: inventoryId, quantity });
    return {
      status: 200,
      data: newCartItem,
      error: null
    };
  } catch (error) {
    console.error("Error adding item to cart:", error);
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
