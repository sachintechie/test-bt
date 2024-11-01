import { createOrder } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { sellerId, totalPrice, status, inventoryItems } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!sellerId || !customerId || !totalPrice || !status || !inventoryItems || !Array.isArray(inventoryItems)) {
      return {
        status: 400,
        data: null,
        error: "All required fields (sellerId, customerId, totalPrice, status, inventoryItems) must be provided."
      };
    }

    for (const item of inventoryItems) {
      if (!item.inventoryId || !item.quantity || item.price === undefined) {
        return {
          status: 400,
          data: null,
          error: "Each inventory item must contain inventoryId and quantity."
        };
      }
    }

    const orderObj = {
      sellerid: sellerId,
      buyerid: customerId,
      totalprice: totalPrice,
      status,
      inventoryItems
    };

    const newOrder = await createOrder(orderObj);

    return {
      status: 200,
      data: newOrder,
      error: null
    };
  } catch (error) {
	console.error("Error creating order:", error);
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
