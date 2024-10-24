import { createProduct,addOwnership } from "../db/adminDbFunctions";
import { productRarity } from "../db/models";
import { mintNFT } from "../lambdas/mintNFT";
import { mintERC1155 } from "../lambdas/mintERC1155";
import { tenant } from "../db/models";

interface CreateProductInput {
  name: string;
  description:string;
  type:string;
  sku:string;
  categoryId: string;
  rarity: productRarity;
  price: number;
  isMintAble?: boolean;
  chainType?: string;
  tokenType?: string;
  quantity?: number;
  toAddress?: string;
  contractAddress?: string;
  metadata?: any;
  tokenId?: number; // for ERC1155
}

export const handler = async (event: any, context: any) => {
  try {
	  
	  const input: CreateProductInput = event.arguments?.input;
	  const tenant = event.identity?.resolverContext as tenant;
	  console.log(event, tenant);
    if (
      !input ||
      !input.name ||
      !input.categoryId ||
      !input.rarity ||
      input.price === undefined 
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Invalid input"
        })
      };
    }

    const product = await createProductInDb({
      name: input.name,
      description:input.description,
      type:input.type,
      sku:input.sku,
      categoryid: input.categoryId,
      rarity: input.rarity,
      price: input.price,
      tenantid:tenant.id,
    });

    const { isMintAble, chainType, tokenType, quantity, toAddress, contractAddress, metadata, tokenId } = event.arguments?.input;
    if (isMintAble && chainType && tokenType && quantity) {
      if (tokenType === "ERC1155") {
        await mintERC1155(toAddress, [tokenId], [quantity], chainType, contractAddress, metadata, tenant.id);
      } else {
        await mintNFT(toAddress, quantity, chainType, contractAddress, metadata, tenant.id);
      }
    }

	if (product) {
	 await addOwnership(product.id, tenant.customerid!);
	}

    return {
      status: 200,
      data: product,
      error: null
    };
  } catch (error) {
    console.error("Error creating product:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      statusCode: 500,
      data: null,
      error: errorMessage
    };
  }
};

async function createProductInDb(input: {
  name: string;
  description: string;
  type: string;
  sku: string;
  categoryid: string;
  rarity: productRarity;
  price: number;
  tenantid:string
}) {
  const newProduct = await createProduct(input);

  // Save to DB
  return newProduct;
}
