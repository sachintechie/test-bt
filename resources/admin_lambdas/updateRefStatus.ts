import { RefType, tenant } from "../db/models";
import { getProjectById, getRefById, getWebsiteRefById, updateRefStatus, updateWebsiteRefStatus } from "../db/adminDbFunctions";
import { ReferenceStatus } from "@prisma/client";
import { addAllStageLambda, callWebCrawlerLambda } from "../knowledgebase/commonFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await updateReferenceStatus(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.refId,
      event.arguments?.input?.status,
      event.arguments?.input?.refType,
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

async function updateReferenceStatus(tenant: tenant, refId: string, status: ReferenceStatus,refType :string) {
  try {
    console.log("ref", tenant.id, refId);
if(refType = RefType.DOCUMENT){
    const refData = await getRefById(refId);
    if (refData.data == null) {
      return {
        project: null,
        error: "Reference not found"
      };
    } else {
      const ref = await updateRefStatus(refId, status);
      if (status === ReferenceStatus.APPROVED ) {
        const project = await getProjectById(ref.projectid ?? "");
        await addAllStageLambda(tenant.adminuserid ?? "", ref.projectid ?? "", project.data?.s3bucketname ?? "", project.data?.name ?? "");
       // await callWebCrawlerLambda(tenant.adminuserid?? "",tenant.id,ref.depth?? 1,ref.url ?? "",ref.id,project.data?.id ?? "",project.data?.s3bucketname?? "",false);
        
      }

      return {
        project: ref,
        error: null
      };
    }
  }
  else if(refType == RefType.WEBSITE){
    const refData = await getWebsiteRefById(refId);
    if (refData.data == null) {
      return {
        project: null,
        error: "Reference not found"
      };
    } else {
      const ref = await updateWebsiteRefStatus(refId, status);
      if (status === ReferenceStatus.APPROVED ) {
        const project = await getProjectById(ref.projectid ?? "");
       // await addAllStageLambda(tenant.adminuserid ?? "", ref.projectid ?? "", project.data?.s3bucketname ?? "", project.data?.name ?? "");
        await callWebCrawlerLambda(tenant.adminuserid?? "",tenant.id,ref.depth?? 1,ref.url ?? "",ref.id,project.data?.id ?? "",project.data?.s3bucketname?? "",false);
        
      }

      return {
        project: ref,
        error: null
      };
    }
  }
  else{
    return {
      project : null,
      error :"Not supported type"
    }
  }
  } catch (e: any) {
    console.log(`Not verified: ${e}`);
    return {
      project: null,
      error: e
    };
  }
}
