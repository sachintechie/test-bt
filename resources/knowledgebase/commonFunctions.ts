import AWS from "aws-sdk";
const lambda = new AWS.Lambda();
import { S3 } from "aws-sdk";
import { Readable } from "stream";
import { syncKb } from "./scanDataSource";
import { EmbeddingMetadata } from "../db/models";
import { storeHash as avalancheStoreHash } from "../avalanche/storeHashFunctions";
import { storeHash as provenanceStoreHash } from "../provenance/storeHashFunctions";
const s3 = new S3();
// const bucketName = process.env.KB_BUCKET_NAME || ""; // Get bucket name from environment variables
import mammoth from "mammoth";
// import pdfParse from 'pdf-parse';
import { parse as parseCSV } from '@fast-csv/parse';
import * as XLSX from "xlsx";
import PDFParser from 'pdf2json';

export async function addReferencesLambda(tenantUserId: string, projectId: string,bucketName:string) {
  const event = {
    tenantUserId: tenantUserId,
    projectId: projectId,
    bucketName: bucketName
  };

  const params = {
    FunctionName: "addReferences-function-ai-sovereignty-dev", // The ARN or name of your background Lambda function
    InvocationType: "Event", // This makes the invocation asynchronous
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  await lambda.invoke(params).promise();
}

export async function addStage1Lambda(tenantUserId: string, projectId: string,bucketName:string,projectName : string) {
  const event = {
    tenantUserId: tenantUserId,
    projectId: projectId,
    bucketName: bucketName,
    projectName: projectName
  };

  const params = {
    FunctionName: "addStage1-function-ai-sovereignty-dev", // The ARN or name of your background Lambda function
    InvocationType: "Event", // This makes the invocation asynchronous
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  await lambda.invoke(params).promise();
}

export async function dataPreperationLambda(tenantUserId: string, projectId: string,bucketName:string) {
  const event = {
    tenantUserId: tenantUserId,
    projectId: projectId,
    bucketName:bucketName
  };

  const params = {
    FunctionName: "dataPreparation-function-ai-sovereignty-dev", // The ARN or name of your background Lambda function
    InvocationType: "Event", // This makes the invocation asynchronous
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  await lambda.invoke(params).promise();
}

export async function lambdaCallForCombineChunks(file_embeddings: any) {
  const event = {
    chunks: file_embeddings
  };

  const params = {
    FunctionName: "arn:aws:lambda:us-east-1:084828599845:function:combine_chunks",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

  const responsePayload = response.Payload as Buffer;

  // Convert the buffer to string (UTF-8 encoded)
  const responseStr = responsePayload.toString("utf-8");

  // Parse the string into a JSON object
  const combinedResponse = JSON.parse(responseStr);

  console.log("Decoded response:", combinedResponse);

  return combinedResponse.body; // Or process further as needed
}

export async function lambdaCallForIndexing(all_embeddings_with_metadata: any) {
  const event = {
    all_embeddings_with_metadata: all_embeddings_with_metadata
  };

  const params = {
    FunctionName: "arn:aws:lambda:us-east-1:084828599845:function:ai_sov_indexing",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

  const responsePayload = response.Payload as Buffer;

  // Convert the buffer to string (UTF-8 encoded)
  const responseStr = responsePayload.toString("utf-8");

  // Parse the string into a JSON object
  const combinedResponse = JSON.parse(responseStr);

  console.log("Decoded response:", combinedResponse);

  return combinedResponse.body; // Or process further as needed
}
export async function lambdaCallForCreateKB(projectId: string,name:string) {
  const event = {
    project_id: projectId,
    project_name:name
  };

  const params = {
    FunctionName: "arn:aws:lambda:us-east-1:084828599845:function:s3_index_kb_creation_consolidate",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

  const responsePayload = response.Payload as Buffer;

  // Convert the buffer to string (UTF-8 encoded)
  const responseStr = responsePayload.toString("utf-8");

  // Parse the string into a JSON object
  const combinedResponse = JSON.parse(responseStr);

  console.log("Decoded response:", combinedResponse);
  if(combinedResponse.errorMessage){
    return {
      error : combinedResponse.errorMessage,
      data:null
    }
  }
  else{
    return {
      data:combinedResponse,
      error:null
    }
  }

}

export async function lambdaCallForCreateS3Bucket(projectId: string,name:string) {
  const event = {
    project_id: projectId,
    project_name:name
  };

  const params = {
    FunctionName: "arn:aws:lambda:us-east-1:084828599845:function:s3_index_kb_creation_consolidate",
    InvocationType: "RequestResponse",
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

  const responsePayload = response.Payload as Buffer;

  // Convert the buffer to string (UTF-8 encoded)
  const responseStr = responsePayload.toString("utf-8");

  // Parse the string into a JSON object
  const combinedResponse = JSON.parse(responseStr);

  console.log("Decoded response:", combinedResponse);
  if(combinedResponse.errorMessage){
    return {
      error : combinedResponse.errorMessage,
      data:null
    }
  }
  else{
    return {
      data:combinedResponse,
      error:null
    }
  }

}


export async function generateRandomString(length: number): Promise<string> {
  return Math.random().toString(36).substring(2, 2 + length); // Random string of specified length
}
export async function combineChunks(chunkList: EmbeddingMetadata[], overlap: number = 20) {
  // Group chunks by file_name
  const fileDict: Record<string, EmbeddingMetadata[]> = {};
  for (const chunk of chunkList) {
    if (!fileDict[chunk.file_name]) {
      fileDict[chunk.file_name] = [];
    }
    fileDict[chunk.file_name].push(chunk);
  }

  // Combine chunks by file_name
  const combinedFiles = [];
  for (const [fileName, chunks] of Object.entries(fileDict)) {
    // Sort chunks by chunk_index
    const sortedChunks = chunks.sort((a, b) => a.chunk_index - b.chunk_index);

    // Start combining chunks, removing overlap
    let combinedContent = sortedChunks[0].chunk_content;
    for (let i = 1; i < sortedChunks.length; i++) {
      const chunkContent = sortedChunks[i].chunk_content.slice(overlap);
      combinedContent += chunkContent;
    }

    // Assume project_id is the same for all chunks of a file
    const projectId = sortedChunks[0].project_id;

    // Add combined content to the result
    combinedFiles.push({
      file_name: fileName,
      file_content: combinedContent,
      project_id: projectId
    });
  }

  return combinedFiles;
}

export async function addToS3Bucket(fileName: string, fileContent: string,bucketName:string) {
  try {
    if (!fileName || !fileContent) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name or content is missing" })
      };
    }

    // Prepare the S3 upload parameters
    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(fileContent, "base64") // Assuming fileContent is base64 encoded
    };

    // Upload the file to S3
    const s3Data = await s3.putObject(params).promise();
    console.log("File uploaded to S3", s3Data);
    // Prepare the S3 upload parameters
    const s3Params = {
      Bucket: bucketName,
      Key: fileName
    };
    const s3Details = await s3.getObject(s3Params).promise();
    console.log("s3Details", s3Details);
    // Check the type of Body
    let objectContent;
    if (Buffer.isBuffer(s3Details.Body)) {
      objectContent = s3Details.Body.toString("base64");
    } else if (typeof s3Details.Body === "string") {
      objectContent = Buffer.from(s3Details.Body); // Convert string to Buffer
      objectContent = objectContent.toString("base64");
    } else if (s3Details.Body instanceof Readable) {
      objectContent = await streamToBuffer(s3Details.Body);
      objectContent = objectContent.toString("base64");
    } else {
      throw new Error("Unexpected type for s3Details.Body");
    }
    //const objectContent = await streamToBuffer(s3Details.Body as Readable);
    const size = await formatBytes(s3Details.ContentLength || 0);
    console.log("File uploaded to s3Details", s3Details, size);
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details?.ETag?.replace(/^"|"$/g, ""),
      fileContent: objectContent,
      contentType: s3Details.ContentType,
      lastModified: s3Details.LastModified
    };

    return {
      data: data,
      error: null
    };
  } catch (e) {
    console.log(`data not uploded to s3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}
// Helper function to convert stream to Buffer
export const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

export async function generatePresignedUrl(files: any,bucketName:string) {
  const urls = await Promise.all(
    files.map(async (file: { contentType: any; fileName: any }) => {
      const key = file.fileName;

      const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 180, // URL expiration time in seconds
        ContentType: file.contentType // Adjust the content type if needed
      };

      const url = await s3.getSignedUrlPromise("putObject", params);

      return { url, key };
    })
  );

  return urls;
}

export async function generateSignedUrl(fileName: string,bucketName:string) {
  const downloadParams = {
    Bucket: bucketName, // Replace with your S3 bucket name
    Key: fileName, // The key (file name) of the uploaded file
    Expires: 7 * 24 * 60 * 60 // Expiry time for the download URL (in seconds)
  };

  // Generate the pre-signed URL for downloading
  const signedUrl = s3.getSignedUrl("getObject", downloadParams);

  return signedUrl;
}

// Helper function to format bytes
export async function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export async function syncKbAsync(knowledgeBaseId: string, datasourceId: string) {
  // This code will run in the background
  await syncKb(knowledgeBaseId, datasourceId ?? "");

  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("Background task completed");
}

export async function getS3Data(fileName: string,bucketName : string) {
  try {
    if (!fileName) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name  is missing" })
      };
    }

    const s3Params = {
      Bucket: bucketName,
      Key: fileName
    };
    const s3Details = await s3.getObject(s3Params).promise();
    console.log("s3Details", s3Details);
    // Check the type of Body
    let objectContent;

    if (Buffer.isBuffer(s3Details.Body)) {
      objectContent = s3Details.Body.toString("base64");
    } else if (typeof s3Details.Body === "string") {
      objectContent = Buffer.from(s3Details.Body); // Convert string to Buffer
      objectContent = objectContent.toString("base64");
    } else if (s3Details.Body instanceof Readable) {
      objectContent = await streamToBuffer(s3Details.Body);
      objectContent = objectContent.toString("base64");
    } else {
      throw new Error("Unexpected type for s3Details.Body");
    }
    const downloadParams = {
      Bucket: bucketName, // Replace with your S3 bucket name
      Key: fileName, // The key (file name) of the uploaded file
      Expires: 60 * 15 // Expiry time for the download URL (in seconds)
    };

    // Generate the pre-signed URL for downloading
    const signedUrl = s3.getSignedUrl("getObject", downloadParams);
    //const objectContent = await streamToBuffer(s3Details.Body as Readable);
    const size = await formatBytes(s3Details.ContentLength || 0);
    console.log("File uploaded to s3Details", s3Details, size);
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details?.ETag?.replace(/^"|"$/g, ""),
      content: objectContent,
      contentType: s3Details.ContentType,
      lastModified: s3Details.LastModified,
      downloadUrl: signedUrl
    };
    return {
      data: data,
      error: null
    };
  } catch (e) {
    console.log(`data not uploded to s3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}




export async function getS3ActualData(fileName: string,bucketName:string) {
  try {
    if (!fileName) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name is missing" })
      };
    }

    const s3Params = {
      Bucket: bucketName,
      Key: fileName
    };
    
    const s3Details = await s3.getObject(s3Params).promise();
    console.log("Fetched S3 Details:", s3Details);
    
    const fileType = fileName.split(".").pop()?.toLowerCase();
    console.log("Detected file type:", fileType);

    // Extract content from the S3 file based on its extension
    const objectContent = await getFileContentFromS3(s3Details.Body as Buffer, fileType ?? "");
    console.log("Extracted file content:", objectContent);

    const downloadParams = {
      Bucket: bucketName,
      Key: fileName,
      Expires: 60 * 15 // Expiry time for the download URL (in seconds)
    };

    const signedUrl = s3.getSignedUrl("getObject", downloadParams);
    const size = await formatBytes(s3Details.ContentLength || 0);
    
    console.log("File processed with size:", size);
    
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details.ETag?.replace(/^"|"$/g, ""),
      content: objectContent,
      contentType: s3Details.ContentType,
      lastModified: s3Details.LastModified,
      downloadUrl: signedUrl
    };
    
    return { data, error: null };
  } catch (e) {
    console.error(`Failed to upload to S3: ${e}`);
    return { data: null, error: e };
  }
}

async function getFileContentFromS3(fileData: Buffer, extension: string): Promise<string> {
  console.log("Processing file with extension:", extension);

  switch (extension.toLowerCase()) {
    case "txt":
    case "md":
    case "html":
      return fileData.toString("utf-8");

    case "json":
      return JSON.stringify(JSON.parse(fileData.toString("utf-8")));

    case "pdf":
      try {
        const pdfData = await parsePDFBuffer(fileData);
        console.log("PDF Data extracted:", pdfData);
        return pdfData;
      } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Error parsing PDF file");
      }

    case "docx":
    case "doc":
      const docData = await mammoth.extractRawText({ buffer: fileData });
      console.log("DOCX Data extracted:", docData.value);
      return docData.value;

    case "csv":
      return await new Promise<string>((resolve, reject) => {
        const rows: string[] = [];
        //  parseCSV(fileData.toString('utf-8'), { headers: false })
        (parseCSV as any)(fileData.toString("utf-8"), { headers: false })
          .on("data", (row: any[]) => rows.push(row.join(",")))
          .on("end", () => resolve(rows.join("\n")))
          .on("error", reject);
      });

    case "xls":
    case "xlsx":
      const workbook = XLSX.read(fileData, { type: "buffer" });
      return XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);

    default:
      console.error(`Unsupported file format: ${extension}`);
      throw new Error(`Unsupported file format: ${extension}`);
  }
}

async function parsePDFBuffer(pdfBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser(this,true);

    pdfParser.on('pdfParser_dataError', (errData) => {
      console.error('Error parsing PDF:', errData.parserError);
      reject(errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', () => {
      const textContent = pdfParser.getRawTextContent();
      console.log('Successfully parsed PDF:', textContent);
      resolve(textContent);
    });

    pdfParser.parseBuffer(pdfBuffer);
  });
}



export async function getS3DataWithoutContent(fileName: string,bucketName:string) {
  try {
    if (!fileName) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name  is missing" })
      };
    }

    const s3Params = {
      Bucket: bucketName,
      Key: fileName
    };
    const s3Details = await s3.getObject(s3Params).promise();
    console.log("s3Details", s3Details);
    // Check the type of Body

    //const objectContent = await streamToBuffer(s3Details.Body as Readable);

    const downloadParams = {
      Bucket: bucketName, // Replace with your S3 bucket name
      Key: fileName, // The key (file name) of the uploaded file
      Expires: 60 * 15 // Expiry time for the download URL (in seconds)
    };

    // Generate the pre-signed URL for downloading
    const signedUrl = s3.getSignedUrl("getObject", downloadParams);
    const size = await formatBytes(s3Details.ContentLength || 0);
    console.log("File uploaded to s3Details", s3Details, size);
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details?.ETag?.replace(/^"|"$/g, ""),
      // content: objectContent,
      contentType: s3Details.ContentType,
      lastModified: s3Details.LastModified,
      downloadUrl: signedUrl
    };
    return {
      data: data,
      error: null
    };
  } catch (e) {
    console.log(`data not uploded to s3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}

export async function storeHashByChainType(hash: string, chainType: string) {
  try {
    let hashResult;
    switch (chainType) {
      case "Avalanche":
        hashResult = await avalancheStoreHash(hash);
        break;

      case "Provenance":
        hashResult = await provenanceStoreHash(
          "0xa0f70a94393b30f8b06382aabe21f16e9bc11b0e6929586dcefb7e83fa6d4d2e",
          hash,
          process.env.PROVANENCE_MNEMONIC || ""
        );

        break;

      default:
        return null;
    }

    return hashResult;
  } catch (err) {
    console.error("Error in handler:", err);
    return null;
  }
}
