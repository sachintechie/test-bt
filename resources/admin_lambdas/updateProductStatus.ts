import { updateProductStatus } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const {productId, status}  = event.arguments?.input;

    if (!productId || !status) {
      return {
        status: 400,
        data: null,
        error: "Product ID and status is required"
      };
    }
    const updatedStatus = await updateProductStatus(productId,status);

    return {
      status: 200,
      data: updatedStatus,
      error: null
    };
  } catch (error) {
    console.error("Error updating product status:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error:errorMessage,
    };
  }
};
