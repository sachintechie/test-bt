import { tenant } from "../db/models";
import { updateProjectStage } from "../db/adminDbFunctions";

import { ProjectStage, ProjectStatusEnum } from "@prisma/client";
import { addReferencesLambda } from "../knowledgebase/commonFunctions";
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

async function addReference(
  tenant: tenant,
  refType: string,
  projectId: string,
  files: any,
  websiteName: string,
  websiteUrl: string,
  depth: number
) {
  console.log("Creating admin user");
  try {
    let datasource_id = BedRockDataSourceS3;
    console.log("createUser", tenant.id, refType);
    await addReferencesLambda(tenant.id, projectId, files, datasource_id);
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
