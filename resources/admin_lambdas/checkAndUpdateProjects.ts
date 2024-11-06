import {
  getAllProjects,
  getAllReferences,
  getFirstReferenceByProjectId,
  updateProjectStage,
  updateRefererncePostIndexing,
  updateRefererncePostS3Data,
  updateReferernces
} from "../db/adminDbFunctions";
import { getKbStatus } from "../knowledgebase/scanDataSource";
import { ProjectStage, ProjectStatusEnum, ReferenceStage } from "@prisma/client";
import { hashingAndStoreToBlockchain, storeHash } from "../avalanche/storeHashFunctions";
import { getS3Data, syncKbAsync } from "../knowledgebase/commonFunctions";

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
