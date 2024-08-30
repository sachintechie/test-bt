import * as cs from "@cubist-labs/cubesigner-sdk";
import { createProduct } from "../db/dbFunctions";
import { productRarity } from "../db/models";

interface CreateProductInput {
  name: string;
  categoryId: string;
  rarity: productRarity;
  price: number;
  purchasedPercentage: number;
}

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const input: CreateProductInput = event.arguments?.input;


    if (!input || !input.name || !input.categoryId || !input.rarity || input.price === undefined || input.purchasedPercentage === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input"
        })
      };
    }

    const product = await createProductInDb({
      name: input.name,
      categoryid: input.categoryId,
      rarity: input.rarity,
      price: input.price,
      purchasedpercentage: input.purchasedPercentage
    });

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
  input: {
    name: string; 
    categoryid: string; 
    rarity: productRarity; 
    price: number; 
    purchasedpercentage: number; 
  }
) {
  const newProduct = await createProduct(input);

  // Save to DB
  return newProduct;
}
