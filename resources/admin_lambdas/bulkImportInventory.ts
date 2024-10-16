import * as XLSX from 'xlsx';
import { tenant } from "../db/models";
import { createBulkInventory } from "../db/adminDbFunctions";


export const handler = async (event: any, context: any) => {
  try {
    console.log("event", event, "context", context);

    const { fileContent, fileName, contentType } = event.arguments?.input;
    const tenantContext = event.identity.resolverContext as tenant;

    if (!fileContent) {
      return {
        status: 400,
        data: null,
        error: "File content is missing"
      };
    }

    
    const buffer = Buffer.from(fileContent, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });


    const sheetName = workbook.SheetNames[0];
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    //  Check required fields and transform data
    const inventoryDataArray = worksheet.map((row: any) => {
		console.log("row", row);
      const {
        productId,
        inventoryId,
        inventoryCategory,
        price,
        quantity,
        ownershipNft,
        smartContractAddress,
        tokenId
      } = row; 

    
      if (!productId || !inventoryId || !inventoryCategory || !price || !quantity) {
        throw new Error(`Missing required fields in row: ${JSON.stringify(row)}`);
      }

    
      return {
        inventoryid: inventoryId,
        productid: productId,
        inventorycategory: inventoryCategory,
        price: parseFloat(price), 
        quantity: parseInt(quantity), 
        ownershipnft: ownershipNft || false,
        smartcontractaddress: smartContractAddress || null,
        tokenid: tokenId || null
      };
    });


    const createdInventories = await createBulkInventory(inventoryDataArray);
    console.log(`Successfully created ${createdInventories.count} inventories`);

    return {
      status: 200,
      data: `Successfully created ${createdInventories.count} inventories`,
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
