import { RefType, tenant } from "../db/models";
import { addReferenceToDb, getDataSourcesCount, isDocumentReferenceExist, isWebsiteReferenceExist } from "../db/adminDbFunctions";
import { S3 } from 'aws-sdk';
import { Readable } from "stream";
import { addWebsiteDataSource, syncKb } from "../knowledgebase/scanDataSource";
import { hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";

const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || '';
const kb_id = process.env.KB_ID || '';
const BedRockDataSourceS3 = process.env.BEDROCK_DATASOURCE_S3 || "";

export const handler = async (event: any, context: any) => {
  try {
    const { resolverContext } = event.identity;
    const { refType, projectId, file, websiteName, websiteUrl, depth } = event.arguments?.input;

    const data = await addReference(
      resolverContext as tenant, refType, projectId, file, websiteName, websiteUrl, depth
    );

    return {
      status: data.document ? 200 : 400,
      data: data.document,
      error: data.error
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return { status: 400, data: null, error: err };
  }
};

async function addReference(tenant: tenant, refType: string, projectId: string, file: any, websiteName: string, websiteUrl: string, depth: number) {
  try {
    const dataStoredToDb: any = {
      s3PreStoreHash: "",
      s3PreStoreTxHash: "",
      s3PostStoreHash: "",
      s3PostStoreTxHash: "",
      chainType: "",
      chainId: ""
    };
    let datasource_id, ingestionJobId,status;
    let isIngested = false;

   

    if (refType === RefType.DOCUMENT) {
      const { s3PreStoreHash, s3PreStoreTxHash, uploadData } = await handleDocumentReference(file, dataStoredToDb);
      dataStoredToDb.s3PreStoreHash = s3PreStoreHash;
      dataStoredToDb.s3PreStoreTxHash = s3PreStoreTxHash;

      datasource_id = BedRockDataSourceS3;
    //   {status,ingestionJobId }= (await syncKb(kb_id, datasource_id)).status === "COMPLETE";
      ({ status, ingestionJobId } = await syncKb(kb_id, datasource_id));

      isIngested = status === "COMPLETE";


    } else if (refType === RefType.WEBSITE) {
        const isRefExist = await isWebsiteReferenceExist( websiteName, websiteUrl);
        if (isRefExist.isExist) return { document: null, error: isRefExist.error };
    
      ({ datasource_id, ingestionJobId } = await handleWebsiteReference(tenant, websiteUrl, websiteName));
      isIngested = true;
    }


    const ref = await addReferenceToDb(tenant.id, file, refType, isIngested, projectId, websiteName, websiteUrl, depth, datasource_id, ingestionJobId, dataStoredToDb);
    if (ref.error) return { document: null, error: ref.error };

    return { document: ref.data, error: null };
  } catch (e) {
    console.error("Error in addReference:", e);
    return { document: null, error: e };
  }
}

async function handleDocumentReference(file: any, dataStoredToDb: any) {
  const hashedData = { fileName: file.fileName, fileContent: file.fileContent };
  const s3PreHashedData = await hashingAndStoreToBlockchain(hashedData);

  if (s3PreHashedData.error) 
    throw s3PreHashedData.error;

  const data = await addToS3Bucket(file.fileName, file.fileContent);

  if (data.data == null) throw data.error;
  const isRefExist = await isDocumentReferenceExist( file,data);
  if (isRefExist.isExist) throw isRefExist.error ;

  const uploadedFile = {
    fileName: data?.data?.fileName,
    fileContent:  data?.data?.s3Object,
  }
  const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile);
  Object.assign(dataStoredToDb, {
    s3PostStoreHash: s3PostHashedData.data?.dataHash,
    s3PostStoreTxHash: s3PostHashedData.data?.dataTxHash,
    chainType: s3PostHashedData.data?.chainType,
    chainId: s3PostHashedData.data?.chainId
  });

  return {
    s3PreStoreHash: s3PreHashedData.data?.dataHash,
    s3PreStoreTxHash: s3PreHashedData.data?.dataTxHash,
    uploadData: uploadedFile
  };
}

async function handleWebsiteReference(tenant: tenant, websiteUrl: string, websiteName: string) {
  const dataSource = await getDataSourcesCount(tenant.id, websiteUrl, RefType.WEBSITE);
  let dataSourceDetails;

  if (dataSource == null) {
    dataSourceDetails = await addWebsiteDataSource("ADD", kb_id, websiteUrl, websiteName);
  } else {
    dataSourceDetails = await addWebsiteDataSource("UPDATE", kb_id, websiteUrl, websiteName, "add_url", dataSource);
  }

  if (dataSourceDetails.error) throw new Error(dataSourceDetails.error);

  return {
    datasource_id: JSON.parse(dataSourceDetails.body).datasource_id,
    ingestionJobId: JSON.parse(dataSourceDetails.body).ingestionJobId
  };
}

async function addToS3Bucket(fileName: string, fileContent: string) {
    try{
  if (!fileName || !fileContent) throw new Error("File name or content is missing");

  const params = { Bucket: bucketName, Key: fileName, Body: Buffer.from(fileContent, "base64") };
  await s3.putObject(params).promise();

  const s3Params = { Bucket: bucketName, Key: fileName };
  const s3Details = await s3.getObject(s3Params).promise();

  const objectContent = await handleS3Content(s3Details.Body);
  const size = formatBytes(s3Details.ContentLength || 0);

  return { data: { fileName, size, url: s3Details.ETag, s3Object: objectContent, contentType: s3Details.ContentType },error:null };
    }catch(e){
        console.log(e);
        return {error:e};
    }
}

async function handleS3Content(body: any) {
  if (Buffer.isBuffer(body)) {
    return body.toString('base64');
  } else if (typeof body === "string") {
    return Buffer.from(body).toString('base64');
  } else if (body instanceof Readable) {
    return (await streamToBuffer(body)).toString('base64');
  }
  throw new Error("Unexpected type for s3Details.Body");
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
  