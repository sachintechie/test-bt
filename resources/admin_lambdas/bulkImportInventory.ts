import * as XLSX from 'xlsx';
import { createBulkInventory } from "../db/adminDbFunctions";


const sanitizeString = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .trim(); 
};

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

    if (contentType === 'text/csv' || fileName.endsWith('.csv')) {
      workbook = XLSX.read(buffer, { type: 'buffer', raw: false });
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
      const sheetData = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '' 
      });

      const headers = sheetData[0];
      const dataRows = sheetData.slice(1);

      const transformedData = dataRows.map((row: any) => {
        const rowData: any = {};
        headers.forEach((header: string, index: number) => {
          let value = row[index];

          
          if (header === 'smartContractAddress') {
            value = value ? sanitizeString(String(value)) : null;
          } else if (header === 'productId' || header === 'inventoryId' || header === 'inventoryCategory') {
            value = value ? sanitizeString(String(value)) : null;
          } else if (header === 'price') {
            value = parseFloat(value);
          } else if (header === 'quantity') {
            value = parseInt(value);
          } else if (header === 'ownershipNft') {
            value = (typeof value === 'string' && value.toLowerCase() === 'true') || value === true ? true : false;
          }
          rowData[header] = value;
        });

        return rowData;
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
