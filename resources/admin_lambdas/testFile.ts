import * as XLSX from 'xlsx'; // Make sure to install this: npm install xlsx

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const { fileContent, fileName } = event.arguments?.input;
    if (!fileContent) {
      return {
        status: 400,
        message: "File content is missing"
      };
    }

    const buffer = Buffer.from(fileContent, 'base64');

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Assuming the data is in the first sheet
    const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (worksheet.length > 0) {
      console.log("First row of the Excel file:", worksheet[0]);
    } else {
      console.log("The Excel file is empty or cannot be parsed.");
    }

    // Return a success response
    return {
      status: 200,
      message: "File processed successfully. Check logs for the first row of data."
    };
  } catch (error) {
    console.error("Error processing the file:", error);

    // Return a failure response
    return {
      status: 500,
      message: "Failed to process the file."
    };
  }
};
