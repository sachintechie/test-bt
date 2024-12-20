import { RefType, tenant } from "../db/models";
import {
  addReferences,
  addWebsiteReferences,
  createProject,
  isProjectExist,
  updateProjectBucket
} from "../db/adminDbFunctions";
import { ProjectType } from "@prisma/client";
import {
  generatePresignedUrlForFirstUpload,
  generateRandomString,
  lambdaCallForCreateS3Bucket
} from "../knowledgebase/commonFunctions";
import { logWithTrace } from "../utils/utils";
import { addStagesStructure } from "../knowledgebase/addStageAndSteps";

export const handler = async (event: any, context: any) => {
  try {
    logWithTrace(event, context);

    const data = await addProjectAndReference(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.name,
      event.arguments?.input?.description,
      event.arguments?.input?.projectType,
      event.arguments?.input?.organizationId,
      event.arguments?.input?.chainType,
      event.arguments?.input?.files
    );
    console.log("data", JSON.stringify(data));

    const response = {
      status: data.project != null ? 200 : 400,
      data: {
        project: data.project?.data,
        urls: data.project?.urls
      },
      error: data.error
    };
    console.log("project", JSON.stringify(response));

    return response;
  } catch (err) {
    logWithTrace("In catch Block Error", err);
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
  chainType: string,
  files: any
) {
  logWithTrace("Creating admin project");

  try {
    logWithTrace("project", tenant.id, projectType);

    const isExist = await isProjectExist(projectType, name, organizationId);
    if (isExist.isExist) {
      return {
        project: null,
        error: isExist.error
      };
    }

    const project = await createProject(tenant, name, description, projectType, chainType, organizationId);
    let sanitizedName: string = name
      .replace(/[^a-z0-9-]/g, "") // Remove invalid characters
      .replace(/^-+/, "") // Remove leading hyphens
      .replace(/^[^a-z0-9]/, "a"); // Ensure it starts with a lowercase letter or alphanumeric

    let randomString: string = await generateRandomString(6); // Generate a 6-character random string
    let finalName: string = `${sanitizedName}-${randomString}`;
    console.log(finalName); // Output: "bridgetower-testptoject121-abc123"
    const kbResponse = await lambdaCallForCreateS3Bucket(project.id, finalName);
    console.log("kbResponse", kbResponse);

    const stagesAndSteps = await addStagesStructure(tenant.adminuserid ?? "", project.id);

    if (project != null && kbResponse && kbResponse.data != null) {
      const updateProject = await updateProjectBucket(project.id, kbResponse?.data.s3_bucket ?? "");
      console.log("updateProjectBucketRes", updateProject);
      const docRef = files.filter((file: any) => file.refType	 === RefType.DOCUMENT);
      console.log("docRef", docRef, docRef.length);
      let generatedUrls;
      if (docRef.length > 0) {
        const refs = await addReferences(tenant.id, tenant.adminuserid ?? "", project.id, docRef, kbResponse.data.s3_bucket);
        console.log("refs", refs);

        generatedUrls = await generatePresignedUrlForFirstUpload(
          refs.data?.filter((file: any) => file.reftype	 === RefType.DOCUMENT),
          kbResponse.data.s3_bucket
        );
        console.log("generatedUrls", generatedUrls);
      }


      const webSiteRef = files.filter((file: any) => file.refType	 === RefType.WEBSITE);
      console.log("webSiteRef", webSiteRef, webSiteRef.length);
      if (webSiteRef.length > 0) {
        const webrefs = await addWebsiteReferences(tenant.id, tenant.adminuserid ?? "", project.id, webSiteRef, kbResponse.data.s3_bucket);
        console.log("webrefs", webrefs);
      }
      if (updateProject == null) {
        return {
          project: null,
          error: "Not able to update project"
        };
      } else {
        const data = {
          data: updateProject,
          urls: generatedUrls
        };
        console.log("final-data", JSON.stringify(data));
        return {
          project: data,
          error: null
        };
      }
    } else {
      return {
        project: null,
        error: kbResponse.error
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
