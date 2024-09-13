import { getWishlistByCustomerId } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { customerId } = event.arguments?.input;

    if (!customerId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID must be provided."
      };
    }

    const wishlistItems = await getWishlistByCustomerId(customerId);

    return {
      status: 200,
      data: wishlistItems,
      error: null
    };
  } catch (error) {
	console.error("Error getting wishlist items:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
