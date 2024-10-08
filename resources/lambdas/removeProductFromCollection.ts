import { removeProductFromCollection } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { collectionId, productId } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!collectionId || !productId || !customerId) {
      return {
        status: 400,
        data: null,
        error: "Collection ID and Product ID must be provided."
      };
    }
    const data = {
      customerid: customerId,
      productid: productId,
      collectionid: collectionId
    };
    // Remove product from collection
    const removedItem = await removeProductFromCollection(data);

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
