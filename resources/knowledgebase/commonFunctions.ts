import AWS from "aws-sdk";
const lambda = new AWS.Lambda();
import { S3 } from "aws-sdk";
import { Readable } from "stream";
import { syncKb } from "./scanDataSource";
import pdfParse from 'pdf-parse';
const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || ""; // Get bucket name from environment variables
export async function addReferencesLambda(tenantUserId: string, projectId: string) {
  const event = {
    tenantUserId: tenantUserId,
    projectId: projectId
  };

  const params = {
    FunctionName: "addReferences-function-ai-sovereignty-dev", // The ARN or name of your background Lambda function
    InvocationType: "Event", // This makes the invocation asynchronous
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  await lambda.invoke(params).promise();
}

export async function lambdaCallForCombineChunks( file_embeddings: any) {
  const event = {
    chunks: file_embeddings
  };

  const params = {
    FunctionName : 'arn:aws:lambda:us-east-1:084828599845:function:combine_chunks',
    InvocationType : 'RequestResponse',
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

    const responsePayload = response.Payload as Buffer;

    // Convert the buffer to string (UTF-8 encoded)
    const responseStr = responsePayload.toString('utf-8');

    // Parse the string into a JSON object
    const combinedResponse = JSON.parse(responseStr);

    console.log('Decoded response:', combinedResponse);
    
    return combinedResponse; // Or process further as needed
}

export async function lambdaCallForIndexing( all_embeddings_with_metadata: any) {
  const event = {
    all_embeddings_with_metadata: all_embeddings_with_metadata
  };

  const params = {
    FunctionName : 'arn:aws:lambda:us-east-1:084828599845:function:ai_sov_indexing',
    InvocationType : 'RequestResponse',
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  const response = await lambda.invoke(params).promise();

    const responsePayload = response.Payload as Buffer;

    // Convert the buffer to string (UTF-8 encoded)
    const responseStr = responsePayload.toString('utf-8');

    // Parse the string into a JSON object
    const combinedResponse = JSON.parse(responseStr);

    console.log('Decoded response:', combinedResponse);
    
    return combinedResponse; // Or process further as needed
}






export async function addToS3Bucket(fileName: string, fileContent: string) {
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
      etag: s3Details?.ETag?.replace(/^"|"$/g, ''),
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

export async function generatePresignedUrl(files: any) {

  const urls = await Promise.all(files.map(async (file: {
    contentType: any; fileName: any; 
}) => {
    const key = file.fileName;

    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: 180, // URL expiration time in seconds
      ContentType: file.contentType, // Adjust the content type if needed
    };

    const url = await s3.getSignedUrlPromise('putObject', params);

    return { url, key };
  }));

  return urls;

}

export async function generateSignedUrl(file: any) {

  const downloadParams = {
    Bucket: bucketName,  // Replace with your S3 bucket name
    Key: file.fileName,  // The key (file name) of the uploaded file
    Expires: 7 * 24 * 60 * 60,  // Expiry time for the download URL (in seconds)
  };

 
    // Generate the pre-signed URL for downloading
    const signedUrl = s3.getSignedUrl('getObject', downloadParams);
 

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

export async function getS3Data(fileName: string) {
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
    if (fileName.endsWith(".pdf")) {
      // const pdfBytes = s3Details.Body as Buffer;
      // const pdfDoc = await PDFDocument.load(pdfBytes);
      // const numberOfPages = pdfDoc.getPages().length;
      const pdfBytes = s3Details.Body as Buffer;
      const pdfData = await pdfParse(pdfBytes);
      objectContent = pdfData.text; // Extract text content from the PDF

    }
    else if (Buffer.isBuffer(s3Details.Body)) {
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
      Bucket: bucketName,  // Replace with your S3 bucket name
      Key: fileName,  // The key (file name) of the uploaded file
      Expires: 60 * 15,  // Expiry time for the download URL (in seconds)
    };
  
   
      // Generate the pre-signed URL for downloading
      const signedUrl = s3.getSignedUrl('getObject', downloadParams);
    //const objectContent = await streamToBuffer(s3Details.Body as Readable);
    const size = await formatBytes(s3Details.ContentLength || 0);
    console.log("File uploaded to s3Details", s3Details, size);
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details?.ETag?.replace(/^"|"$/g, ''),
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

export async function getS3DataWithoutContent(fileName: string) {
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
      Bucket: bucketName,  // Replace with your S3 bucket name
      Key: fileName,  // The key (file name) of the uploaded file
      Expires: 60 * 15,  // Expiry time for the download URL (in seconds)
    };
  
   
      // Generate the pre-signed URL for downloading
      const signedUrl = s3.getSignedUrl('getObject', downloadParams);
    const size = await formatBytes(s3Details.ContentLength || 0);
    console.log("File uploaded to s3Details", s3Details, size);
    const data = {
      fileName: fileName,
      size: size,
      etag: s3Details?.ETag?.replace(/^"|"$/g, ''),
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




