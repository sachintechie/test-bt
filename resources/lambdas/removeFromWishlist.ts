import { removeFromWishlist } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { productId } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!customerId || !productId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID and Product ID must be provided."
      };
    }

    // Remove product from wishlist
    const removedWishlistItem = await removeFromWishlist(customerId, productId);

    return {
      status: 200,
      data: removedWishlistItem,
      error: null
    };
  } catch (error) {
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
