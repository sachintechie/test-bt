import { createOrder } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { sellerId, productId, price, quantity, status } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!sellerId || !customerId || !productId || !price || !quantity || !status) {
      return {
        status: 400,
        data: null,
        error: "All required fields (sellerid, customerId, productid, price, quantity, status) must be provided."
      };
    }

    const orderObj = {
      sellerid: sellerId,
      buyerid: customerId,
      productid: productId,
      price,
      quantity,
      status
    };

    const newOrder = await createOrder(orderObj);

    return {
      status: 200,
      data: newOrder,
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
