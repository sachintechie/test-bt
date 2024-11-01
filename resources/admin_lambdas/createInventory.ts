import { tenant } from "../db/models";
import { createInventory, addOwnership, getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event, "context", context);

    const { productId, inventoryId, inventoryCategory, price, quantity, ownershipNft, smartContractAddress, tokenId } =
      event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;

    if (!productId || !inventoryCategory || !price || !quantity || !inventoryId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input, missing required fields"
      };
    }

    const inventory = await createInventoryInDb({
      inventoryId,
      productId,
      inventoryCategory,
      price,
      quantity,
      ownershipNft,
      smartContractAddress,
      tokenId
    });

    if (inventory) {
      const adminUser = await getAdminUserById(tenant.adminuserid!);
      console.log("adminUser", adminUser);
      const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
      console.log("customer", customer);
      if (customer) {
        await addOwnership(inventory.id, customer.id!);
      }
    }

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

async function createInventoryInDb(inventoryData: any) {
  const newInventory = await createInventory({
    inventoryid: inventoryData.inventoryId,
    productid: inventoryData.productId,
    inventorycategory: inventoryData.inventoryCategory,
    price: inventoryData.price,
    quantity: inventoryData.quantity,
    ownershipnft: inventoryData.ownershipNft,
    smartcontractaddress: inventoryData.smartContractAddress,
    tokenid: inventoryData.tokenId
  });
  return newInventory;
}
