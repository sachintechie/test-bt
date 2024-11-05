import { updateProductAttributes } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, data } = event.arguments?.input;

    if (!productId || !Array.isArray(data) || data.length === 0) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: productId and data array are required."
      };
    }

    const updatedAttribute = await updateProductAttributes(productId, data);

    return {
      status: 200,
      data: updatedAttribute,
      error: null
    };
  } catch (error) {
    console.error("Error updating product attributes:", error);
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
