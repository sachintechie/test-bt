import { deleteProductAttributes } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, attributeIds } = event.arguments?.input;

    if (!productId || !attributeIds || !Array.isArray(attributeIds) || attributeIds.length === 0) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const result = await deleteProductAttributes(productId, attributeIds);
    console.log(result);

    return {
      status: 200,
      data: `Successfully deleted ${result.count} attributes`,
      error: null
    };
  } catch (error) {
    console.error("Error deleting attributes:", error);
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
