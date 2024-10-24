import { S3 } from 'aws-sdk';
import { getProductById, insertMediaEntries, deleteMediaEntries } from '../db/adminDbFunctions';
const s3 = new S3();
const bucketName = process.env.PRODUCT_BUCKET_NAME || '';
if (!bucketName) {
  throw new Error("Bucket name is not set in environment variables");
}
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { productId, filesToBeAdded, filesToBeDeleted } = event.arguments?.input;

    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const product = await getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }

    
    if (filesToBeDeleted && filesToBeDeleted.length > 0) {
      await deleteFilesFromS3AndDB(filesToBeDeleted, productId);
    }

    let newMediaEntries: { entityid: string; entitytype: string; url: string; type: any; }[] = [];
    if (filesToBeAdded && filesToBeAdded.length > 0) {
      newMediaEntries = await handleMultipleFiles(filesToBeAdded, productId);
    }

    const response = {
      status: 200,
      data: newMediaEntries,
      error: null
    };

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

async function handleMultipleFiles(files: any[], productId: string) {
  const uploadPromises = files.map(async (file) => {
    try {
      const fileUploadData = await addToS3Bucket(file.fileName, file.fileContent);
      return {
        entityid: productId,
        entitytype: 'product',
        url: fileUploadData.data?.url || 'N/A',
        type:file.type
      };
    } catch (err: any) {
      console.log(`Error uploading file ${file.fileName}:`, err.message);
      return null
    }
  });

  const mediaData = await Promise.all(uploadPromises);
  const filteredMediaData = mediaData.filter((entry) => entry !== null);
  if (filteredMediaData.length > 0) {
    await insertMediaEntries(filteredMediaData);
  }

  return filteredMediaData;
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
    return { data: { url } };
  } catch (e) {
    console.log(`Error uploading to S3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}

async function deleteFilesFromS3AndDB(filesToBeDeleted: string[], productId: string): Promise<void> {
  try {
    const deletePromises = filesToBeDeleted.map(async (fileUrl) => {
      const fileName = fileUrl.split('/').pop();
      const params = { Bucket: bucketName, Key: fileName };
      await s3.deleteObject(params).promise();
    });
    await Promise.all(deletePromises);
    await deleteMediaEntries(filesToBeDeleted, productId);

  } catch (err: any) {
    console.log(`Error deleting files from S3: ${err.message}`);
    throw new Error(`Error deleting files from S3 or DB: ${err.message}`);
  }
}
