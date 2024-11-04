import {  tenant } from "../db/models";
import {  updateProjectStage  } from "../db/adminDbFunctions";
import { S3 } from 'aws-sdk';
import { Readable } from "stream";
import { ProjectStage, ProjectStatusEnum } from "@prisma/client";
import {  addReferencesLambda } from "./addProjectAndReference";
const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || ''; // Get bucket name from environment variables
const BedRockDataSourceS3 = process.env.BEDROCK_DATASOURCE_S3 || "";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.refType,
      event.arguments?.input?.projectId,
      event.arguments?.input?.files,
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




async function addReference(tenant: tenant, refType: string,projectId:string, files: any, websiteName: string, websiteUrl: string, depth: number) {
  console.log("Creating admin user");

  try {
    let datasource_id = BedRockDataSourceS3;

    console.log("createUser", tenant.id, refType);

    // const dataStoredToDb: any = {
    //   s3PreStoreHash: "",
    //   s3PreStoreTxHash: "",
    //   s3PostStoreHash: "",
    //   s3PostStoreTxHash: "",
    //   chainType: "",
    //   chainId: ""
    // };

        await addReferencesLambda(tenant.id, projectId, files, datasource_id);
    

  //   for (let file of files){
    
  //   if (refType === RefType.DOCUMENT) {
  //     const hashedData = {
  //       fileName: file.fileName,
  //       fileContent: file.fileContent
  //     }
  //     const s3PreHashedData = await hashingAndStoreToBlockchain(hashedData);
  //     if(s3PreHashedData.error){
  //       return {
  //         document: null,
  //         error: s3PreHashedData.error
  //       };
  //     }
  //     dataStoredToDb.s3PreStoreHash = s3PreHashedData.data?.dataHash;
  //     console.log("s3PreStoreHash", s3PreHashedData.data?.dataHash);
  //     dataStoredToDb.s3PreStoreTxHash = s3PreHashedData.data?.dataTxHash;

  //     console.log("s3PreStoreTxHash", s3PreHashedData.data?.dataTxHash);
  //     data = await addToS3Bucket(file.fileName, file.fileContent);
  //     if (data.data == null) {
  //       return {
  //         document: null,
  //         error: data.error
  //       };
  //     }

  //     console.log("data", data);
  //     const isRefExist = await isDocumentReferenceExist( file,data);
  //   if(isRefExist.isExist){
  //     return {
  //       document: null,
  //       error: isRefExist.error
  //     };
  //   }
  //     const uploadedFile = {
  //       fileName: data?.data?.fileName,
  //       fileContent:  data?.data?.s3Object,
  //     }
  //     console.log("uploadedFile", uploadedFile);
  //     const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile);
  //     dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.dataHash;
  //     dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.dataTxHash;
  //     dataStoredToDb.chainType = s3PostHashedData.data?.chainType;
  //     dataStoredToDb.chainId = s3PostHashedData.data?.chainId;

  //     console.log("s3PostStorHash", s3PostHashedData.data?.dataHash);
  //     console.log("s3PostStoreTxHash", s3PostHashedData.data?.dataTxHash);

  //     datasource_id = BedRockDataSourceS3;
      
  //   ({ status, ingestionJobId } = await syncKb(kb_id, datasource_id));

  //   isIngested = status === "COMPLETE";
  //   console.log("syncKbResponse", status);
  //   } 
    
  //   else if (refType === RefType.WEBSITE) {
  //     const isRefExist = await isWebsiteReferenceExist( websiteName, websiteUrl);
  //   if(isRefExist.isExist){
  //     return {
  //       document: null,
  //       error: isRefExist.error
  //     };
  //   }
  //     const dataSource = await getDataSourcesCount(tenant.id,refType);
  //     console.log("dataSource", dataSource);

  //     let dataSourceDetails;
  //     if (dataSource == null) {
  //       dataSourceDetails = await addWebsiteDataSource("ADD", kb_id, websiteUrl, websiteName);
  //     } else {
  //       dataSourceDetails = await addWebsiteDataSource("UPDATE", kb_id, websiteUrl, websiteName, "add_url", dataSource);
  //     }
  //     if (dataSourceDetails.error || dataSourceDetails.errorMessage) {
  //       return {
  //         document: null,
  //         error: dataSourceDetails.error || dataSourceDetails.errorMessage
  //       };
  //     }
  //     console.log("dataSourceDetails", dataSourceDetails);
  //     datasource_id = JSON.parse(dataSourceDetails.body).datasource_id;
  //     ingestionJobId = JSON.parse(dataSourceDetails.body).ingestionJobId;
  //     console.log("datasource_id", datasource_id, ingestionJobId);

  //   }

  //   console.log("datasource_id", datasource_id, ingestionJobId);

  
  //   const ref = await addReferenceToDb(
  //     tenant.id,
  //     file,
  //     refType,
  //     isIngested,
  //     projectId,
  //     websiteName,
  //     websiteUrl,
  //     depth,
  //     datasource_id,
  //     data?.data,
  //     ingestionJobId,
  //     dataStoredToDb
  //   );
  //   refs.push(ref.data);
  //   if(ref.error){
  //     console.log("Error in addReferenceToDb", ref.error);
  //     // return {
  //     //   document: null,
  //     //   error: ref.error
  //     // };
  //     //refs.push(ref.error);
  //   }
  // }

  const updatedProject = await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
  console.log("updatedProject", updatedProject);

    return {
      document: updatedProject,
      error: null
    };
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      document: null,
      error: e
    };
  }
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
      objectContent = s3Details.Body.toString('base64');
    } else if (typeof s3Details.Body === "string") {
      objectContent = Buffer.from(s3Details.Body); // Convert string to Buffer
      objectContent = objectContent.toString('base64');
    } else if (s3Details.Body instanceof Readable) {
      objectContent = await streamToBuffer(s3Details.Body);
      objectContent = objectContent.toString('base64');

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
      contentType : s3Details.ContentType
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
const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

// Helper function to format bytes
async function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}


