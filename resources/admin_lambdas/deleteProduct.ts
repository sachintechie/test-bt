import { deleteProduct } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const productId  = event.arguments?.input?.productId;

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Product ID is required"
      };
    }
    const deletedProduct = await deleteProduct(productId);

    return {
      status: 200,
      data: deletedProduct,
      error: null
    };
  } catch (error) {
    console.error("Error deleting product", error);
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
