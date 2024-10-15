import { updateInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { inventoryId, inventoryData } = event.arguments?.input;

    // Validate the input
    if (!inventoryId || !inventoryData) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const updatedInventoryData: any = { ...inventoryData };

    // Remove any attempt to update productId or inventoryId
    if ('productId' in updatedInventoryData) {
      return {
        status: 400,
        data: null,
        error: "Updating productId is not allowed."
      };
    }
    if ('inventoryId' in updatedInventoryData) {
      return {
        status: 400,
        data: null,
        error: "Updating inventoryId is not allowed."
      };
    }

    // Rename fields to match database schema if needed
    if (inventoryData.inventoryCategory) {
      updatedInventoryData.inventorycategory = inventoryData.inventoryCategory;
      delete updatedInventoryData.inventoryCategory;
    }

    if (inventoryData.smartContractAddress) {
      updatedInventoryData.smartcontractaddress = inventoryData.smartContractAddress;
      delete updatedInventoryData.smartContractAddress;
    }

    if (inventoryData.ownershipNft !== undefined) {
      updatedInventoryData.ownershipnft = inventoryData.ownershipNft;
      delete updatedInventoryData.ownershipNft;
    }

    // Update the inventory in the database
    const updatedInventory = await updateInventory(inventoryId, updatedInventoryData);

    return {
      status: 200,
      data: updatedInventory,
      error: null
    };
  } catch (error) {
    console.error("Error updating inventory:", error);
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
