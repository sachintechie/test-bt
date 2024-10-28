import { RefType, tenant } from "../db/models";
import {
  addDocumentReference,
  addReferenceToDb,
  createProject,
  isProjectExist,
  updateProductStatus,
  updateProjectStage
} from "../db/adminDbFunctions";
import { ProjectStage, ProjectStatusEnum, ProjectType } from "@prisma/client";
import { hashingAndStoreToBlockchain } from "../avalanche/storeHashFunctions";
import { addToS3Bucket } from "./addRefToKnowledgeBase";
import { getKbStatus, syncKb } from "../knowledgebase/scanDataSource";
const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables
const BedRockDataSourceS3 = process.env.BEDROCK_DATASOURCE_S3 || "";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addProjectAndReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.projectType,
      event.arguments?.input?.organizationId,
      event.arguments?.input?.files
    );
    console.log("data", data);

    const response = {
      status: data.project != null ? 200 : 400,
      data: data.project,
      error: data.error
    };
    console.log("project", response);

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

async function addProjectAndReference(
  tenant: tenant,
  name: string,
  description: string,
  projectType: ProjectType,
  organizationId: string,
  files: any
) {
  console.log("Creating admin project");

  try {
    console.log("project", tenant.id, projectType);

    const isExist = await isProjectExist(projectType, name, organizationId);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const project = await createProject(tenant, name, description, projectType, organizationId, kb_id);
    let datasource_id = BedRockDataSourceS3;

    if (project != null) {
      (async () => {
        try {
          await addReferences(tenant, project, files, datasource_id);
        } catch (error) {
          console.error("Error in async task:", error);
        }
      })();

      return {
        project: project,
        error: null
      };
    } else {
      return {
        project: null,
        error: "Project not created"
      };
    }
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      project: null,
      error: e
    };
  }
}

async function addReferences(tenant: tenant, project: any, files: any, datasource_id: string) {
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
    const s3PreHashedData = await hashingAndStoreToBlockchain(hashedData);
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
    const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile);
    dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.dataHash;
    dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.dataTxHash;
    dataStoredToDb.chainType = s3PostHashedData.data?.chainType;
    dataStoredToDb.chainId = s3PostHashedData.data?.chainId;

    console.log("s3PostStorHash", s3PostHashedData.data?.dataHash);
    console.log("s3PostStoreTxHash", s3PostHashedData.data?.dataTxHash);
    const ref = await addDocumentReference(
      tenant.id,
      file,
      RefType.DOCUMENT,
      isIngested,
      project.id,
      datasource_id,
      data?.data,
      "null",
      dataStoredToDb
    );
  }

  const updatedProject = await updateProjectStage(project.id, ProjectStage.DATA_STORAGE, ProjectStatusEnum.ACTIVE);
  console.log("updatedProject", updatedProject);
  return updatedProject;
}
