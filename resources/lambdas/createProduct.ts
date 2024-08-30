import { createProduct } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { name, categoryId, rarity, price, ownershipId } = event.arguments?.input;

    if (!name || !categoryId || !rarity || !price || !ownershipId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input"
        })
      };
    }

    const product = await createProductInDb(name, categoryId, rarity, price, ownershipId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        data: product,
        error: null
      })
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        data: null,
        error: "Internal Server Error"
      })
    };
  }
};

async function createProductInDb(
  name: string,
  categoryId: string,
  rarity: string,
  price: number,
  ownershipId: string
) {
  // Logic to create the product in the database
  const product = { name, categoryId, rarity, price, ownershipId };
  const newProduct = await createProduct(product);

  // Save to DB
  return newProduct;
}
