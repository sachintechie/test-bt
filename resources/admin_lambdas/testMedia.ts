import { S3 } from 'aws-sdk';
const s3 = new S3();
const bucketName = process.env.PRODUCT_BUCKET_NAME || '';
if (!bucketName) {
  throw new Error("Bucket name is not set in environment variables");
}
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const files = event.arguments?.input?.files;
    if (!files || files.length === 0) {
      throw new Error("No files provided for upload.");
    }
    const data = await handleMultipleFiles(files);

    const response = {
      status: data.length > 0 ? 200 : 400,
      data: data,
      error: null
    };
    console.log("File upload response:", response);

    return response;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function handleMultipleFiles(files: any[]) {
  const uploadPromises = files.map(async (file) => {
    try {
      const fileUploadData = await addToS3Bucket(file.fileName, file.fileContent);
      return {
        fileName: file.fileName,
        url: fileUploadData.data?.url || 'N/A'
      };
    } catch (err: any) {
      console.log(`Error uploading file ${file.fileName}:`, err);
      return {
        fileName: file.fileName,
        error: err.message
      };
    }
  });

  return Promise.all(uploadPromises);
}

async function addToS3Bucket(fileName: string, fileContent: string) { 
  try {
    if (!fileName || !fileContent) {
      return {
        data: null,
        error: JSON.stringify({ message: 'File name or content is missing' }),
      };
    }
    const sanitizedFileName = fileName.replace(/ /g, '_');
    const unique = new Date().getTime();
    const uniqueFileName = `${unique}-${sanitizedFileName}`;
    const url = `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`;

    const params = {
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: Buffer.from(fileContent, 'base64'),
    };
    await s3.putObject(params).promise();

    const data = {
       url: url
    };

    return {
      data: data,
      error: null
    };
  } catch (e) {
    console.log(`Error uploading to S3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}
