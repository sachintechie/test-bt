import { getOrdersBySeller } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { sellerId } = event.arguments?.input;

    if (!sellerId) {
      return {
        status: 400,
        data: null,
        error: "Seller ID must be provided."
      };
    }

    const orders = await getOrdersBySeller(sellerId);

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