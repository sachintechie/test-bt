import {
  getAllProjects,
  getAllReferences,
  getFirstReferenceByProjectId,
  getFirstWebReferenceByProjectId,
  updateProjectStage,
  updateRefererncePostIndexing,
  updateRefererncePostS3Data,
  updateReferernces
} from "../db/adminDbFunctions";
import { getKbStatus } from "../knowledgebase/scanDataSource";
import { ProjectStage, ProjectStatusEnum, ReferenceStage } from "@prisma/client";
import { hashingAndStoreToBlockchain, storeHash } from "../avalanche/storeHashFunctions";
import { addAllStageLambda, getS3Data, syncKbAsync } from "../knowledgebase/commonFunctions";

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
    let updatedProjects = [""];
    const projects = await getAllProjects();

    for (const project of projects) {
      const reference = await getFirstWebReferenceByProjectId(project.id);
      if (reference != null) {
        await addAllStageLambda(reference.createdby ?? "", project.id ?? "", project.s3bucketname ?? "", project?.name ?? "");
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
        if (ref.referencestage == ReferenceStage.DATA_SOURCE) {
          const dataStoredToDb: any = {
            s3PreStoreHash: "",
            s3PreStoreTxHash: "",
            s3PostStoreHash: "",
            s3PostStoreTxHash: "",
            completeChunkTxHash: "",
            chainType: "",
            chainId: ""
          };
          const data = await getS3Data(ref.name ?? "", "");

          const uploadedFile = {
            fileName: data?.data?.fileName,
            fileContent: data?.data?.content
          };
          console.log("uploadedFile", uploadedFile);
          const s3PostHashedData = await hashingAndStoreToBlockchain(uploadedFile, "Avalanche", true);
          dataStoredToDb.s3PostStoreHash = s3PostHashedData.data?.hash;
          dataStoredToDb.s3PostStoreTxHash = s3PostHashedData.data?.txHash;
          //  const status = await getKbStatus(project.knowledgebaseid, ref?.datasourceid ?? "");
          // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
          const updateReference = await updateRefererncePostS3Data(ref.id ?? "", true, dataStoredToDb);
          console.log("updatedRefs", updateReference);

          updatedRefs.push(updateReference);
        } else if (ref.referencestage == ReferenceStage.DATA_STORAGE) {
          const dataStoredToDb: any = {
            completeChunkTxHash: "",
            chunksTxHash: ""
          };
        }
      }
    }

    return updatedRefs;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
