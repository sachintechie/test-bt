import * as XLSX from 'xlsx';

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { fileContent, fileName, contentType } = event.arguments?.input;

    if (!fileContent) {
      return {
        status: 400,
        message: "File content is missing"
      };
    }

    const buffer = Buffer.from(fileContent, 'base64');
    let parsedData: any[] = [];

    if (contentType === 'text/csv' || fileName.endsWith('.csv')) {
     
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0]; 
      parsedData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    } else if (contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileName.endsWith('.xlsx')) {
   
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      
      workbook.SheetNames.forEach((sheetName: string | number) => {
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        parsedData.push({
          sheetName: sheetName,
          data: sheetData,
        });
      });
    } else {
      return {
        status: 400,
        message: "Unsupported file format"
      };
    }

    // Log all rows from each sheet
    parsedData.forEach(sheet => {
      console.log(`Data from sheet '${sheet.sheetName}':`, sheet.data);
    });

 
    return {
      status: 200,
      message: "File processed successfully. Check logs for data from all rows."
    };
  } catch (error) {
    console.error("Error processing the file:", error);

  
    return {
      status: 500,
      message: "Failed to process the file."
    };
  }
};
