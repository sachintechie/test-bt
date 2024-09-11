import { getOrderById } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { orderId } = event.arguments?.input;

    if (!orderId) {
      return {
        status: 400,
        data: null,
        error: "Order ID must be provided."
      };
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return {
        status: 404,
        data: null,
        error: "Order not found."
      };
    }

    return {
      status: 200,
      data: order,
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