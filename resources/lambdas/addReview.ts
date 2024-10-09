import { addReview } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { productId, orderId, comment, rating } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!customerId || !productId || !orderId || !comment || !rating) {
      return {
        status: 400,
        data: null,
        error: "Customer ID, Product ID, Order ID, Comment and Rating must be provided."
      };
    }

    const data = {
      customerid: customerId,
      productid: productId,
      orderid: orderId,
      comment,
      rating
    };

    const review = await addReview(data);

    return {
      status: 200,
      data: review,
      error: null
    };
  } catch (error) {
    console.error("Error adding review to product:", error);
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
