import { updateProduct } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, productData } = event.arguments?.input;

    // Validate the input
    if (!productId || !productData) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const updatedProductData: any = {
      ...productData
    };

    // Convert categoryId to categoryid and lowercase it if provided
    if (productData.categoryId) {
      updatedProductData.categoryid = productData.categoryId.toLowerCase();
      delete updatedProductData.categoryId; // Remove the original camel case field
    }

    // Rename purchasedPercentage to purchasedpercentage and calculate availablepercentage if provided
    if (productData.purchasedPercentage !== undefined) {
      if (productData.purchasedPercentage > 100) {
        return {
          status: 400,
          data: null,
          error: "purchasedPercentage cannot exceed 100."
        };
      }

      updatedProductData.purchasedpercentage = productData.purchasedPercentage;
      updatedProductData.availablepercentage = 100 - productData.purchasedPercentage;
      delete updatedProductData.purchasedPercentage; // Remove the original camel case field
    }

    const updatedProduct = await updateProduct(productId, updatedProductData);

    return {
      status: 200,
      data: updatedProduct,
      error: null
    };
  } catch (error) {
    console.error("Error updating product:", error);
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
