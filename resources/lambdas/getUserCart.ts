import { getUserCart } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;

    // Validate customer ID
    if (!customerId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID must be provided.",
      };
    }

    // Retrieve cart items for the user
    const cartItems = await getUserCart(customerId);

    return {
      status: 200,
      data: cartItems,
      error: null,
    };
  } catch (error) {
    console.error("Error retrieving user cart:", error);
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
