import { addProductToCollection } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    const { productId, collectionId } = event.arguments?.input;

    if (!customerId || !productId || !collectionId) {
      return {
        status: 400,
        data: null,
        error: "Customer ID, Product ID and Collection ID must be provided."
      };
    }

    const data = {
      customerid: customerId,
      productid: productId,
      collectionid: collectionId
    };

    const collection = await addProductToCollection(data);

    return {
      status: 200,
      data: collection,
      error: null
    };
  } catch (error) {
    console.error("Error adding product to collection:", error);
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
