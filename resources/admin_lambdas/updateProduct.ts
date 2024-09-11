import { updateProduct } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, productData } = event.arguments?.input;

    if (!productId || !productData) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    // If purchasedpercentage is provided, calculate availablepercentage
    if (productData.purchasedpercentage !== undefined) {
      if (productData.purchasedpercentage > 100) {
        return {
          status: 400,
          data: null,
          error: "purchasedpercentage cannot exceed 100."
        };
      }
      productData.availablepercentage = 100 - productData.purchasedpercentage;
    }

    // Now pass the productData (including availablepercentage if applicable) to updateProduct
    const updatedProduct = await updateProduct(productId, productData);

    return {
      status: 200,
      data: updatedProduct,
      error: null
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      status: 500,
      data: null,
      error: error
    };
  }
};
