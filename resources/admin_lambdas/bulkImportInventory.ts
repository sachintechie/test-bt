import * as XLSX from 'xlsx';
import { tenant } from "../db/models";
import { createBulkInventory } from "../db/adminDbFunctions";

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
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    
    let inventoryDataArray: any[] = [];

    // Loop through each sheet in the workbook
    workbook.SheetNames.forEach((sheetName: string | number) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);

      
      const transformedData = sheetData.map((row: any) => {
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

        // Check if required fields are present
        if (!productId || !inventoryId || !inventoryCategory || !price || !quantity) {
          throw new Error(`Missing required fields in sheet '${sheetName}' for row: ${JSON.stringify(row)}`);
        }

        
        return {
          inventoryid: inventoryId,
          productid: productId,
          inventorycategory: inventoryCategory,
          price: parseFloat(price), 
          quantity: parseInt(quantity), 
          ownershipnft: ownershipNft ?? false,
          smartcontractaddress: smartContractAddress || null,
          tokenid: tokenId || null
        };
      });

     
      inventoryDataArray = [...inventoryDataArray, ...transformedData];
    });
	 const createdInventories = await createBulkInventory(inventoryDataArray);
  
    console.log(`Successfully created ${createdInventories.count} inventories across all sheets`);

    return {
      status: 200,
      data: `Successfully created ${createdInventories.count} inventories across all sheets`,
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
