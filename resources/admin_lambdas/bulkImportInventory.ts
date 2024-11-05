import * as XLSX from 'xlsx';
import { tenant } from "../db/models";
import { createBulkInventory, addOwnership,getAdminUserById } from "../db/adminDbFunctions";
import {  getCustomer } from "../db/dbFunctions";
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET!);

export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event, "context", context);

    const { fileContent, fileName, contentType } = event.arguments?.input?.file;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!fileContent) {
      return {
        status: 400,
        data: null,
        error: "File content is missing"
      };
    }

    const buffer = Buffer.from(fileContent, 'base64');
    let workbook;

    if (contentType === 'text/csv' || fileName.endsWith('.csv')) {
      workbook = XLSX.read(buffer, { type: 'buffer', raw: true });
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx')) {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    } else {
      return {
        status: 400,
        data: null,
        error: "Unsupported file format"
      };
    }

    let inventoryDataArray: any[] = [];

    workbook.SheetNames.forEach((sheetName: string | number) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);

      const transformedData = sheetData.map((row: any) => {
        console.log("row", row);
        const {
          productId,
          inventoryId,
          inventoryCategory,
          price,
          quantity,
          ownershipNft,
          smartContractAddress,
          tokenId,
          name,
          description,
          chain,
          type
        } = row;

        if (!productId || !inventoryId || !inventoryCategory || !price || !quantity) {
          throw new Error(`Missing required fields in sheet '${sheetName}' for row: ${JSON.stringify(row)}`);
        }

        const ownershipNftBoolean = (typeof ownershipNft === 'string' && ownershipNft.toLowerCase() === 'true') ? true : false;

        console.log("ownershipNftBoolean", ownershipNftBoolean);
        return {
          inventoryid: inventoryId,
          productid: productId,
          inventorycategory: inventoryCategory,
          price: parseFloat(price),
          quantity: parseInt(quantity),
          ownershipnft: ownershipNftBoolean,
          smartcontractaddress: smartContractAddress || null,
          tokenid: tokenId || null,
          name: name || null,
          description: description || null,
          chain: chain || null,
          type: type || null
        };
      });

      inventoryDataArray = [...inventoryDataArray, ...transformedData];
    });

   const createdInventories = await createBulkInventory(inventoryDataArray);
   console.log(`Successfully created ${createdInventories.length} inventories across all sheets`, createdInventories);

	const adminUser = await getAdminUserById(tenantContext.adminuserid!);
	const customer = await getCustomer(adminUser?.tenantuserid!, tenantContext.id!);

	if (customer) {
  		for (const inventory of createdInventories) {
    	await addOwnership(inventory.id, customer.id!);
    	}
	}
 

    return {
      status: 200,
      data: `Successfully created ${createdInventories.length} inventories and ownerships across all sheets`,
      error: null
    };
  } catch (error) {
    console.error("Error processing and creating inventories:", error);
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


interface InventoryData {
  inventoryid: string;
  productid: string;
  inventorycategory?: string;
  price: number;
  quantity: number;
  ownershipnft?: boolean;
  smartcontractaddress?: string;
  tokenid?: string;
  chain?: string;
  name?: string;
  description?: string;
  type?: string;
}

/**
 * Creates multiple Stripe products with one-time prices from a list of inventory data
 *
 * @param inventoryDataArray - An array of inventory data objects
 * @param tenantIdParam - The tenant ID to be included in the metadata
 * @returns A promise that resolves to an array of created product and price objects
 *
 * This function iterates over each item in the provided inventory data array and maps
 * its fields to Stripe product and price properties. For each item, it constructs the
 * product's name, description, and metadata, including blockchain-related metadata like
 * tokenId, chain, and contract address. The function calls createProductWithOneTimePrice
 * for each item to create the corresponding Stripe product and price. Finally, it
 * collects and returns an array of all created products and prices.
 */
async function createMultipleStripeProducts(inventoryDataArray: InventoryData[],tenantIdParam:string) {
  const createdProducts: Array<{ product: Stripe.Product; price: Stripe.Price }> = [];

  for (const inventoryData of inventoryDataArray) {
    // Map inventory data fields to Stripe product fields
    const name = inventoryData.name || 'No name';
    const description = inventoryData.description || 'No description';
    const unitAmount = inventoryData.price; // Convert price to cents
    const currency = 'usd'; // Assuming USD, change as needed

    // Extract metadata fields
    const tokenId = inventoryData.tokenid || 'N/A';
    const chain = inventoryData.chain || '';
    const contract = inventoryData.smartcontractaddress || '';
    const tenantId = tenantIdParam; // Replace with actual tenant ID if applicable
    const type = inventoryData.type || 'N/A';

    try {
      // Create a Stripe product and price for each inventory item
      const { product, price } = await createStripeProductWithOneTimePrice(
        name,
        description,
        unitAmount,
        currency,
        tokenId,
        chain,
        contract,
        tenantId,
        type
      );
      if(product && price)
      createdProducts.push({ product, price });
    } catch (error) {
      console.error(`Error creating product for inventory item ${inventoryData.productid}:`, error);
    }
  }

  return createdProducts;
}


/**
 * Creates a Stripe product with a one-time price
 * @param {string} name - The name of the product
 * @param {string} description - The description of the product
 * @param {number} unitAmount - The price amount in cents (e.g., 1000 for $10.00)
 * @param {string} currency - The currency for the price (e.g., 'usd')
 * @param {string} tokenId - The token ID to be included in the metadata
 * @param {string} chain - The blockchain network (e.g., 'AVAX') to be included in the metadata
 * @param {string} contract - The contract address to be included in the metadata
 * @param {string} tenantId - The tenant ID to be included in the metadata
 * @param {string} type - The type of token (e.g., 'ERC1155') to be included in the metadata
 * @returns {object} - The created product and price objects
 */
async function createStripeProductWithOneTimePrice(name: string, description: string, unitAmount: number, currency: string, tokenId: string, chain: string, contract: string, tenantId: string, type: string): Promise<{ product: Stripe.Product|null; price: Stripe.Price|null }>{
  try {
    // Step 1: Create the product with metadata
    const product = await stripe.products.create({
      name,
      description,
      active: true, // Product is active by default
      metadata: {
        id: tokenId,       // Token ID
        chain,             // Blockchain network
        contract,          // Contract address
        tenant_id: tenantId, // Tenant ID
        type               // Token type
      }
    });

    console.log('Product created:', product);

    // Step 2: Create a one-time price for the product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: unitAmount,
      currency,
      metadata: { price_type: 'one_time' } // Optional metadata for price
    });

    console.log('Price created:', price);

    return { product, price };
  } catch (error) {
    console.error('Error creating product or price:', error);
    return {product:null,price:null};
  }
}
