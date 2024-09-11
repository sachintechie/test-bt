import { createOrder } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { sellerId, buyerId, productId, price, quantity, status } = event.arguments?.input;

    if (!sellerId || !buyerId || !productId || !price || !quantity || !status) {
      return {
        status: 400,
        data: null,
        error: "All required fields (sellerid, buyerid, productid, price, quantity, status) must be provided."
      };
    }

    const orderObj = {
      sellerid:sellerId,
      buyerid:buyerId,
      productid:productId,
      price,
      quantity,
      status,
    };

    const newOrder = await createOrder(orderObj);

    return {
      status: 200,
      data: newOrder,
      error: null
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
