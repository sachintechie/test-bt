import * as XLSX from 'xlsx';
import { tenant } from "../db/models";
import { createBulkProduct } from "../db/adminDbFunctions";

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

    let productDataArray: any[] = [];

    workbook.SheetNames.forEach((sheetName: string | number) => {
      const sheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(sheet);

      const transformedData = sheetData.map((row: any) => {
        const {
          name,
          description,
          type,
          sku,
          categoryId,
          rarity,
          price
        } = row;

        if (!name || !description || !type || !price || !sku || !categoryId || !rarity) {
          throw new Error(`Missing required fields in sheet '${sheetName}' for row: ${JSON.stringify(row)}`);
        }
        return {
          name: name,
          description: description,
          type: type,
          sku:sku,
          categoryid:categoryId,
          rarity:rarity,
          price: parseFloat(price),
          tenantid: tenantContext.id
        };
      });

      productDataArray = [...productDataArray, ...transformedData];
    });

    const createdProducts = await createBulkProduct(productDataArray);

    console.log(`Successfully created ${createdProducts.count} products across all sheets`);

    return {
      status: 200,
      data: `Successfully created ${createdProducts.count} products across all sheets`,
      error: null
    };
  } catch (error) {
    console.error("Error processing and creating products:", error);
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
