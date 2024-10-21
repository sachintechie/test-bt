import { deleteInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const inventoryId = event.arguments?.input?.inventoryId;

    if (!inventoryId) {
      return {
        status: 400,
        data: null,
        error: "Inventory ID is required"
      };
    }

    const deletedInventory = await deleteInventory(inventoryId);

    return {
      status: 200,
      data: deletedInventory,
      error: null
    };
  } catch (error) {
    console.error("Error deleting inventory", error);
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
