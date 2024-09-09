import { getOrdersByProductId } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { productId } = event.arguments?.input;

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Product ID must be provided."
      };
    }

    const orders = await getOrdersByProductId(productId);

    return {
      status: 200,
      data: orders,
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
