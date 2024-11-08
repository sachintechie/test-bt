import { updateOrderStatus } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { orderId, status } = event.arguments?.input;

    if (!orderId || !status) {
      return {
        status: 400,
        data: null,
        error: "Order ID and status must be provided."
      };
    }

    const updatedOrder = await updateOrderStatus(orderId, status);

    return {
      status: 200,
      data: updatedOrder,
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
