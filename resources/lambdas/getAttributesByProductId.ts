import { getAttributesByProductId } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId } = event.arguments?.input;

    if (!productId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: productId is required"
      };
    }

    const attributes = await getAttributesByProductId(productId);

    if (!attributes || attributes.length === 0) {
      return {
        status: 404,
        data: null,
        error: "No attributes found for the given productId"
      };
    }

    return {
      status: 200,
      data: attributes,
      error: null
    };
  } catch (error) {
    console.error("Error retrieving attributes:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
