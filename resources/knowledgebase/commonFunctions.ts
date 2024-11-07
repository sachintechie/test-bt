import AWS from "aws-sdk";
const lambda = new AWS.Lambda();
import { S3 } from "aws-sdk";
import { Readable } from "stream";
import { syncKb } from "./scanDataSource";
const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || ""; // Get bucket name from environment variables

export async function addReferencesLambda(tenantUserId: string, projectId: string, files: any) {
  const event = {
    tenantUserId: tenantUserId,
    projectId: projectId,
    files: files
  };

  const params = {
    FunctionName: "addReferences-function-ai-sovereignty-dev", // The ARN or name of your background Lambda function
    InvocationType: "Event", // This makes the invocation asynchronous
    Payload: JSON.stringify(event)
  };

  // Invoke the other Lambda function asynchronously
  await lambda.invoke(params).promise();
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
      s3Object: objectContent,
      contentType: s3Details.ContentType
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
      url: s3Details.ETag,
      s3Object: objectContent,
      contentType: s3Details.ContentType
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
