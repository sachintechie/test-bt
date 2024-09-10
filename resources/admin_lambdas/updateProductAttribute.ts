import { updateProductAttribute } from "../db/dbFunctions"; 

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, key, newValue } = event.arguments?.input;

    if (!productId || !key || !newValue) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: productId, key, and newValue are required."
      };
    }

    
    const updatedAttribute = await updateProductAttribute(productId, key, newValue);

    return {
      status: 200,
      data: updatedAttribute,
      error: null
    };
  } catch (error) {
    console.error("Error updating product attribute:", error);
    return {
      status: 500,
      data: null,
      error: error
    };
  }
};
