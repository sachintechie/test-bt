import { S3 } from 'aws-sdk';
const s3 = new S3();
const bucketName = process.env.PRODUCT_BUCKET_NAME || '';

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const files = event.arguments?.input?.files;
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
      console.log(`Uploaded file: ${file.fileName}`, fileUploadData);
      return {
        fileName: file.fileName,
        size: fileUploadData.data?.size || 'N/A',
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

    const params = {
      Bucket: bucketName,
      Key: fileName,
      Body: Buffer.from(fileContent, 'base64'),
    };

    const s3Data = await s3.putObject(params).promise();
    console.log('File uploaded to S3', s3Data);

    const s3Params = {
      Bucket: bucketName,
      Key: fileName,
    };
    const s3Details = await s3.getObject(s3Params).promise();
    const size = await formatBytes(s3Details.ContentLength || 0);

    console.log('S3 file details', s3Details, size);

    const data = {
      fileName: fileName,
      size: size,
      url: s3Details.ETag
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

async function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
