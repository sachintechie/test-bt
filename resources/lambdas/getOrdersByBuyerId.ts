import { getOrdersByBuyer } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { buyerId } = event.arguments?.input;

    if (!buyerId) {
      return {
        status: 400,
        data: null,
        error: "Buyer ID must be provided."
      };
    }

    const orders = await getOrdersByBuyer(buyerId);

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
