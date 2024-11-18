import { updateProduct,getAdminUserById } from "../db/adminDbFunctions";
import { getCustomer } from "../db/dbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, productData } = event.arguments?.input;

	const tenant = event.identity?.resolverContext as tenant;

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

	const adminUser = await getAdminUserById(tenant.adminuserid!);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);

    const updatedProduct = await updateProduct(productId, updatedProductData, customer.id);

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
