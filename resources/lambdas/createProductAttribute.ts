import { productattribute } from "../db/models";
import { createProductAttribute } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { key, value, type, productId } = event.arguments?.input;

    if (!key || !value || !type || !productId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const attribute = await createAttributeInDb(key, value, type, productId);

    return {
      status: 200,
      data: attribute,
      error: null
    };
  } catch (error) {
    console.error("Error creating attribute:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};

async function createAttributeInDb(key: string, value: string, type: string, productId: string) {
  // Logic to create the product attribute in the database
  const attributeData: productattribute = { key, value, type, productid:productId };
  const newAttribute = await createProductAttribute(attributeData);

  // Save to DB
  return newAttribute;
}
