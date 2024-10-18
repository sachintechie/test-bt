import { searchInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const inventoryId = event.arguments?.input?.inventoryId || '';
    const productName = event.arguments?.input?.productName || '';

    if (!inventoryId && !productName) {
      return {
        status: 400,
        data: null,
        error: "Either Inventory ID or Product Name is required"
      };
    }

    const searchResult = await searchInventory(inventoryId, productName);

    return {
      status: 200,
      data: searchResult,
      error: null
    };
  } catch (error) {
    console.error("Error searching inventory", error);
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
