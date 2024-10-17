import * as XLSX from 'xlsx';
import { createBulkInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { fileContent, fileName, contentType } = event.arguments?.input?.file;

    console.log("fileContent", fileContent, "fileName", fileName, "contentType", contentType);
    if (!fileContent) {
      return {
        status: 400,
        data: null,
        error: "File content is missing"
      };
    }

    const buffer = Buffer.from(fileContent, 'base64');
    let workbook;

    if (contentType === 'text/csv' || fileName.endsWith('.csv') || contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx')) {
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
          tokenId
        } = row;

        if (!productId || !inventoryId || !inventoryCategory || !price || !quantity) {
          throw new Error(`Missing required fields in sheet '${sheetName}' for row: ${JSON.stringify(row)}`);
        }

        // Check if ownershipNft is a string before applying toLowerCase()
        const ownershipNftBoolean = (typeof ownershipNft === 'string' && ownershipNft.toLowerCase() === 'true') ? true : false;

        return {
          inventoryid: inventoryId,
          productid: productId,
          inventorycategory: inventoryCategory,
          price: parseFloat(price),
          quantity: parseInt(quantity),
          ownershipnft: ownershipNftBoolean,
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

