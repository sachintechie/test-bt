import {
  getAllProjects,
  getAllReferences,
  getFirstReferenceByProjectId,
  updateProjectStage,
  updateRefererncePostIndexing,
  updateRefererncePostS3Data,
  updateReferernces
} from "../db/adminDbFunctions";
import { getKbStatus, syncKb } from "../knowledgebase/scanDataSource";
import { ProjectStage, ProjectStatusEnum, ReferenceStage } from "@prisma/client";
import { hashingAndStoreToBlockchain, storeHash } from "../avalanche/storeHashFunctions";
import { S3 } from "aws-sdk";
import { Readable } from "stream";
import { formatBytes, streamToBuffer } from "./addRefToKnowledgeBase";
const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || ""; // Get bucket name from environment variables

export const handler = async (event: any) => {
  try {
    const projects = await updateProjects();
    const reference = await updateReferences();
    return {
      status: 200,
      data: projects,
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function updateProjects() {
  try {
    let updatedProjects = [];
    const projects = await getAllProjects();

    for (const project of projects) {
      const reference = await getFirstReferenceByProjectId(project.id);
      if (reference != null) {
        if (project.projectstage == ProjectStage.DATA_PREPARATION) {
          const status = await getKbStatus(project.knowledgebaseid, reference?.datasourceid ?? "");
          if (status == "AVAILABLE") {
            // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
            const updateProject = await updateProjectStage(project.id, ProjectStage.LLM_FINE_TUNING, ProjectStatusEnum.ACTIVE);
            const updateReference = await updateReferernces(project.id, true);
            console.log("updateReference", updateReference);

            updatedProjects.push(updateProject);
          }
        } else if (project.projectstage == ProjectStage.DATA_SELECTION) {
          const status = await getKbStatus(project.knowledgebaseid, reference?.datasourceid ?? "");
          if (status == "AVAILABLE") {
            syncKbAsync(project.knowledgebaseid, reference?.datasourceid ?? "");

            // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
            const updateProject = await updateProjectStage(project.id, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);

            updatedProjects.push(updateProject);
          }
        }
      }
    }

    return updatedProjects;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateReferences() {
  try {
    let updatedRefs = [];
    const refs = await getAllReferences();

    for (const ref of refs) {
      if (ref != null) {
        if (ref.referencestage == ReferenceStage.DATA_SELECTION) {
          const dataStoredToDb: any = {
            s3PreStoreHash: "",
            s3PreStoreTxHash: "",
            s3PostStoreHash: "",
            s3PostStoreTxHash: "",
            completeChunkTxHash: "",
            chainType: "",
            chainId: ""
          };
          const data = await getS3Data(ref.name ?? "");

          const uploadedFile = {
            fileName: data?.data?.fileName,
            fileContent: data?.data?.s3Object
          };
          console.log("uploadedFile", uploadedFile);
          const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile, true);
          dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.dataHash;
          dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.dataTxHash;
          //  const status = await getKbStatus(project.knowledgebaseid, ref?.datasourceid ?? "");
          // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
          const updateReference = await updateRefererncePostS3Data(ref.id ?? "", true, dataStoredToDb);
          console.log("updatedRefs", updateReference);

          updatedRefs.push(updateReference);
        } else if (ref.referencestage == ReferenceStage.DATA_INDEX) {
          const dataStoredToDb: any = {
            completeChunkTxHash: "",
            chunksTxHash: ""
          };
          const chunksTxHash = await hashingAndStoreToBlockchain(ref.chunkshash, false);
          dataStoredToDb.chunksTxHash = chunksTxHash.data?.dataTxHash;

          if (ref.completechunkhash) {
            const completeChunkTxHash = await storeHash(ref.completechunkhash, false);
            dataStoredToDb.completeChunkTxHash = completeChunkTxHash.data?.transactionId;
          }
          const updateReference = await updateRefererncePostIndexing(ref.id ?? "", true, dataStoredToDb);
          console.log("updatedRefs", updateReference);
          const updateProject = await updateProjectStage(ref.projectid ?? "", ProjectStage.PUBLISHED, ProjectStatusEnum.ACTIVE);

          updatedRefs.push(updateReference);
        }
      }
    }

    return updatedRefs;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function syncKbAsync(knowledgeBaseId: string, datasourceId: string) {
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
