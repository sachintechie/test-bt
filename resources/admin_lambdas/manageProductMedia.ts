
import { tenant } from "../db/models";
import { S3, GuardDuty } from 'aws-sdk';
import { getProductById, insertMediaEntries, deleteMediaEntries, getAdminUserById } from '../db/adminDbFunctions';
import { getCustomer } from "../db/dbFunctions";

const s3 = new S3();
const guardDuty = new GuardDuty();

const bucketName = process.env.PRODUCT_BUCKET_NAME || '';
const detectorId = process.env.GUARDDUTY_DETECTOR_ID || ''; // Make sure this is set in your environment variables

if (!bucketName) {
  throw new Error("Bucket name is not set in environment variables");
}
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    const tenant = event.identity.resolverContext as tenant;

    const { productId, filesToBeAdded, filesToBeDeleted } = event.arguments?.input;

    if (!productId) {
      throw new Error("Product ID is required.");
    }

    const product = await getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found.`);
    }


    const adminUser = await getAdminUserById(tenant.adminuserid!);
    console.log("adminUser", adminUser);
    const customer = await getCustomer(adminUser?.tenantuserid!, tenant.id!);
    console.log("customer", customer);
    const customerId  = customer.id


    if (filesToBeDeleted && filesToBeDeleted.length > 0) {
      await deleteFilesFromS3AndDB(filesToBeDeleted, productId, customerId);
    }

    let newMediaEntries: { entityid: string; entitytype: string; url: string; type: any }[] = [];
    if (filesToBeAdded && filesToBeAdded.length > 0) {
      newMediaEntries = await handleMultipleFiles(filesToBeAdded, productId, customerId);
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

async function handleMultipleFiles(files: any[], productId: string, customerId:string) {
  const uploadPromises = files.map(async (file) => {
    try {
      const fileUploadData = await addToS3Bucket(file.fileName, file.fileContent);
      return {
        entityid: productId,
        entitytype: "product",
        url: fileUploadData.data?.url || "N/A",
        type: file.contentType
      };
    } catch (err: any) {
      console.log(`Error uploading file ${file.fileName}:`, err.message);
      return null;
    }
  });

  const mediaData = await Promise.all(uploadPromises);
  const filteredMediaData = mediaData.filter((entry) => entry !== null);
  if (filteredMediaData.length > 0) {
    await insertMediaEntries(filteredMediaData, customerId);
  }

  return filteredMediaData;
}

async function addToS3Bucket(fileName: string, fileContent: string) {
  try {
    if (!fileName || !fileContent) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name or content is missing" })
      };
    }
    const sanitizedFileName = fileName.replace(/ /g, "_");
    const unique = new Date().getTime();
    const uniqueFileName = `${unique}-${sanitizedFileName}`;
    const url = `https://${bucketName}.s3.amazonaws.com/${uniqueFileName}`;

    const params = {
      Bucket: bucketName,
      Key: uniqueFileName,
      Body: Buffer.from(fileContent, "base64")
    };
    await s3.putObject(params).promise();
    console.log("Malicious check below")
    const isMalicious = await checkForMalwareFindings(uniqueFileName);
    console.log("Malicious check above")
    if (isMalicious) {
      console.log(`Malware detected in file: ${uniqueFileName}. Deleting file...`);
      await s3.deleteObject({ Bucket: bucketName, Key: uniqueFileName }).promise();
      return { data: null, error: 'Malware detected, file deleted' };
    }
    return { data: { url } };
  } catch (e) {
    console.log(`Error uploading to S3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}

async function deleteFilesFromS3AndDB(filesToBeDeleted: string[], productId: string, customerId:string): Promise<void> {
  try {
    const deletePromises = filesToBeDeleted.map(async (fileUrl) => {
      const fileName = fileUrl.split("/").pop();
      const params = { Bucket: bucketName, Key: fileName };
      await s3.deleteObject(params).promise();
    });
    await Promise.all(deletePromises);

    await deleteMediaEntries(filesToBeDeleted, productId, customerId);


  } catch (err: any) {
    console.log(`Error deleting files from S3: ${err.message}`);
    throw new Error(`Error deleting files from S3 or DB: ${err.message}`);
  }
}


async function checkForMalwareFindings(fileName: string): Promise<boolean> {
  try {
    console.log("In Malicious check")
    if (!detectorId) {
      console.log("GuardDuty Detector ID is not set");
      return false;
    }
    console.log("above Malicious findings")
    const findings = await guardDuty.listFindings({
      DetectorId: detectorId,
      FindingCriteria: {
        Criterion: {
          'resource.s3ObjectDetails.key': {
            Eq: [fileName]
          }
        }
      }
    }).promise();
    console.log("below Malicious findings")
    if (findings.FindingIds && findings.FindingIds.length > 0) {
      console.log(`GuardDuty found malware for file: ${fileName}`);
      return true;
    }

    return false;
  } catch (err:any) {
    console.error(`Error checking GuardDuty findings: ${err.message}`);
    return false;
  }
}

