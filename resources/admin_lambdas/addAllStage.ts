import {
  getProjectById
} from "../db/adminDbFunctions";

import { addStage_1 } from "../knowledgebase/stageFunctions";


export const handler = async (event: any, context: any) => {
  try {
    const { projectId, tenantUserId,bucketName,projectName } = event;
    const project = await getProjectById(projectId);

    // Calls function to handle adding stages and steps for file processing
   const data =  await addStage_1(
      project.data?.tenantid ?? "",
      tenantUserId,
      projectId,
      project.data?.s3bucketname ?? "",
      project.data?.chaintype ?? ""
    );
    return {
      status: 200,
      data: "data",
      error: "data"
    };
  } catch (err) {
    console.error("Error in handler:", err);
    return { status: 400, data: null, error: err };
  }
};






