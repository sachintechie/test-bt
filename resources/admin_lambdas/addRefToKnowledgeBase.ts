import { RefType, tenant } from "../db/models";
import { addReferenceToDb  } from "../db/adminDbFunctions";
import { S3 } from 'aws-sdk';
const s3 = new S3();
const bucketName = process.env.BUCKET_NAME || ''; // Get bucket name from environment variables
export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.refType,
      event.arguments?.input?.file,
      event.arguments?.input?.websiteName,
      event.arguments?.input?.websiteUrl,
      event.arguments?.input?.depth
    );

    const response = {
      status: data.document != null ? 200 : 400,
      data: data.document,
      error: data.error
    };
    console.log("document", response);

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

async function addReference(tenant: tenant, refType: string, file: any,websiteName: string,websiteUrl: string,depth: number) {   
   console.log("Creating admin user");

  try {
    console.log("createUser", tenant.id, refType);
    let data;
    if(refType === RefType.DOCUMENT){
       data = await addToS3Bucket(file.fileName, file.fileContent);
      console.log("data", data);  
    }
    const ref = await addReferenceToDb(tenant.id, file,refType, websiteName,websiteUrl,depth,data?.data);
        return {
      document: ref,
      error: null
    };
  } catch (e) {
    console.log(`Not verified: ${e}`);
    return {
      document: null,
      error: e
    };
  }
}

async function addToS3Bucket(fileName: string, fileContent: string) { 
  try{
  if (!fileName || !fileContent) {
    return {
      data : null,
      error: JSON.stringify({ message: 'File name or content is missing' }),
    };
  }

  // Prepare the S3 upload parameters
  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: Buffer.from(fileContent, 'base64'), // Assuming fileContent is base64 encoded
  };

  // Upload the file to S3
   const s3Data = await s3.putObject(params).promise();
   console.log('File uploaded to S3', s3Data);
   // Prepare the S3 upload parameters
  const s3Params = {
    Bucket: bucketName,
    Key: fileName,
  };
   const s3Details =await s3.getObject(s3Params).promise();
   const size = await formatBytes(s3Details.ContentLength || 0);

   console.log('File uploaded to s3Details', s3Details,size);
  const data ={
    fileName: fileName,
    size: size,
    url:s3Details.ETag
    
  }
  return {
    data : data,
    error: null
  };
}
catch (e) {
  console.log(`data not uploded to s3: ${e}`);
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
  return  parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}