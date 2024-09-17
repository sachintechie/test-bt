import { removeProductFromCollection } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { collectionId, productId } = event.arguments?.input;

    if (!collectionId || !productId) {
      return {
        status: 400,
        data: null,
        error: "Collection ID and Product ID must be provided."
      };
    }

    // Remove product from collection
    const removedItem = await removeProductFromCollection(collectionId, productId);

    return {
      status: 200,
      data: removedItem,
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
