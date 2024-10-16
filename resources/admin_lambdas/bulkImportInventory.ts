import * as XLSX from 'xlsx';
import { tenant } from "../db/models";
import { createBulkInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
	  
	  const { fileContent, fileName, contentType } = event.arguments?.input?.file;
	  console.log("event", event.arguments?.input?.file,);
  

    if (!fileContent) {
      return {
        status: 400,
        data: null,
        error: "File content is missing"
      };
    }

    
    const buffer = Buffer.from(fileContent, 'base64');
    let workbook;

    // Check if the file is a CSV or an XLSX file
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

    // Perform bulk creation of all inventory records across all sheets using Prisma's createMany
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
