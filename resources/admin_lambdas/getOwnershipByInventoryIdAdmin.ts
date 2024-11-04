import { getOwnershipByInventoryId } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { inventoryId } = event.arguments?.input;

    if (!inventoryId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: inventoryId is required"
      };
    }

    const ownership = await getOwnershipByInventoryId(inventoryId);

    if (!ownership) {
      return {
        status: 404,
        data: null,
        error: "No ownership found for the given inventoryId"
      };
    }

    return {
      status: 200,
      data: ownership,
      error: null
    };
  } catch (error) {
    console.error("Error retrieving ownership:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
