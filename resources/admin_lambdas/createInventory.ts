import { tenant } from "../db/models";
import { createInventory } from "../db/adminDbFunctions"; 

export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event, "context", context);

    const { productId, inventoryId, inventoryCategory, price, quantity, ownershipNft, smartContractAddress, tokenId, fraction,fractional } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;


  
    if (!productId || !inventoryCategory || !price || !quantity  || !inventoryId ) {
      return {
        status: 400,
        data: null,
        error: "Invalid input, missing required fields"
      };
    }

    const inventory = await createInventoryInDb( {
	  inventoryId,
      productId,
      inventoryCategory,
      price,
      quantity,
      ownershipNft,
      smartContractAddress,
      tokenId,
	  fraction: fraction ? fraction : 0,
	  fractional: fractional ? fractional : false
    });

    return {
      status: 200,
      data: inventory,
      error: null
    };
  } catch (error) {
    console.error("Error creating inventory:", error);
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

async function createInventoryInDb( inventoryData: any) {
  const newInventory = await createInventory({
	inventoryid: inventoryData.inventoryId,
    productid: inventoryData.productId,
    inventorycategory: inventoryData.inventoryCategory,
    price: inventoryData.price,
    quantity: inventoryData.quantity,
    ownershipnft: inventoryData.ownershipNft,
    smartcontractaddress: inventoryData.smartContractAddress,
    tokenid: inventoryData.tokenId,
	fraction : inventoryData.fraction,
	fractional : inventoryData.fractional
  });
  return newInventory;
}
