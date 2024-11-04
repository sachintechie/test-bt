import { createProductAttributes } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, data } = event.arguments?.input;


    if (!productId || !data || !Array.isArray(data) || data.length === 0) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const attributes = data.map(({ key, value, type }) => ({
      key,
      value,
      type,
      productid: productId
    }));

    const result = await createProductAttributes(attributes);

    return {
      status: 200,
      data: result,
      error: null
    };
  } catch (error) {
    console.error("Error creating attribute:", error);
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
