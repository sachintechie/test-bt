import { RefType, tenant } from "../db/models";
import { addReferenceToDb, getProjectById } from "../db/adminDbFunctions";
import { ReferenceStatus } from "@prisma/client";
import { generatePresignedUrlForFirstUpload } from "../knowledgebase/commonFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await addFileToProject(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.projectId,
      event.arguments?.input?.files
    );

    const response = {
      status: data.data != null ? 200 : 400,
      data: data.data,
      error: data.error
    };
    console.log("data", response);

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

async function addFileToProject(tenant: tenant, projectId: string, files: any) {
  console.log("Creating admin user");
  try {
    const refs = [];

    console.log("createUser", tenant.id);
    const project = await getProjectById(projectId);
    if (project && project.data) {
      for (const file of files) {
        const ref = await addReferenceToDb(tenant.id, file, false, projectId, ReferenceStatus.PENDING, true, tenant?.adminuserid ?? "");
        if (ref.data) refs.push(ref.data);
      }
      console.log("refs", refs);
      const urls = await generatePresignedUrlForFirstUpload(refs, project.data.s3bucketname ?? "");
      console.log("urls", urls);
      console.log("refs", refs);

      return {
        data: { refs, urls },
        error: null
      };
    } else {
      return {
        data: null,
        error: "Project not found"
      };
    }
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}
