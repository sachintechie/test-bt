import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { createProduct } from "../db/dbFunctions";
import { ownership, ProductAttributes, category } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { name, categoryId, rarity, price, tenantUserId, category, productAttributes, ownerships } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!name || !categoryId || !rarity || !price || !category || !productAttributes || !ownerships) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input"
        })
      };
    }

    const product = await createProductInDb(name, categoryId, rarity, price, category, productAttributes, ownerships);

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
  category: category,
  productAttributes: ProductAttributes[],
  ownerships: ownership[]
) {
  // Logic to create the product in the database
  const product = { name, categoryId, rarity, price, category, productAttributes, ownerships };
  const newProduct = await createProduct(product);

  // Save to DB
  return newProduct;
}
