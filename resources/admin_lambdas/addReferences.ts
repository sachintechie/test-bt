import { RefType } from "../db/models";
import { addDocumentReference,updateProjectStage } from "../db/adminDbFunctions";
import { hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
import { ProjectStage, ProjectStatusEnum } from "@prisma/client";
import { addToS3Bucket } from "./addRefToKnowledgeBase";


export const handler = async (event: any, context: any) => {
  try {
    const {  projectId, files, datasource_id, tenantId } = event;

    const data = await addReferences(
      tenantId,  projectId, files, datasource_id
    );

    return {
      status: data ? 200 : 400,
      data: data,
      error: data
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return { status: 400, data: null, error: err };
  }
};


export async function addReferences(tenantId: string, projectId: string, files: any, datasource_id: string) {
  for (const file of files) {
    let data;
    let isIngested = false;
    const dataStoredToDb: any = {
      s3PreStoreHash: "",
      s3PreStoreTxHash: "",
      s3PostStoreHash: "",
      s3PostStoreTxHash: "",
      chainType: "",
      chainId: ""
    };

    const hashedData = {
      fileName: file.fileName,
      fileContent: file.fileContent
    };
    const s3PreHashedData = await hashingAndStoreToBlockchain(hashedData,false);
    dataStoredToDb.chainType = s3PreHashedData.data?.chainType;
    dataStoredToDb.chainId = s3PreHashedData.data?.chainId;
    if (s3PreHashedData.error) {
      return {
        document: null,
        error: s3PreHashedData.error
      };
    }
    dataStoredToDb.s3PreStoreHash = s3PreHashedData.data?.dataHash;
    console.log("s3PreStoreHash", s3PreHashedData.data?.dataHash);
    dataStoredToDb.s3PreStoreTxHash = s3PreHashedData.data?.dataTxHash;

    console.log("s3PreStoreTxHash", s3PreHashedData.data?.dataTxHash);
    data = await addToS3Bucket(file.fileName, file.fileContent);
    if (data.data == null) {
      return {
        document: null,
        error: data.error
      };
    }

    const uploadedFile = {
      fileName: data?.data?.fileName,
      fileContent: data?.data?.s3Object
    };
    console.log("uploadedFile", uploadedFile);
    // const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile,true);
    // dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.dataHash;
    // dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.dataTxHash;


    // console.log("s3PostStorHash", s3PostHashedData.data?.dataHash);
    // console.log("s3PostStoreTxHash", s3PostHashedData.data?.dataTxHash);
    const ref = await addDocumentReference(
      tenantId,
      file,
      RefType.DOCUMENT,
      isIngested,
      projectId,
      datasource_id,
      data?.data,
      "null",
      dataStoredToDb
    );
  }

  const updatedProject = await updateProjectStage(projectId, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
  console.log("updatedProject", updatedProject);
  return updatedProject;
}


  