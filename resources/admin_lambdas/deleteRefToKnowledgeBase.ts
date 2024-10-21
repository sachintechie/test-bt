import { RefType, tenant } from "../db/models";
import { deleteRef, getReferenceById } from "../db/adminDbFunctions";
import { S3 } from "aws-sdk";
import { addWebsiteDataSource, syncKb } from "../knowledgebase/scanDataSource";
const s3 = new S3();
const bucketName = process.env.KB_BUCKET_NAME || ""; // Get bucket name from environment variables
const kb_id = process.env.KB_ID || ""; // Get knowledge base ID from environment variables

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await deleteReference(event.identity.resolverContext as tenant, event.arguments?.input?.refId);

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

async function deleteReference(tenant: tenant, refId: string) {
  console.log("Creating admin user");

  try {
    console.log("createUser", tenant.id);
    let data;
    const reference = await getReferenceById(tenant.id, refId);
    if (reference != null && reference.reftype == RefType.DOCUMENT) {
      data = await deleteFromS3(reference?.name ?? "");
      console.log("data", data);
    } else if (reference != null && reference.reftype == RefType.WEBSITE) {
      const dataSourceDetails = await addWebsiteDataSource("DELETE", kb_id, reference?.url ?? "", "", reference?.datasourceid ?? "");
      console.log("deleted dataSourceDetails", dataSourceDetails);
    }
    const syncKbResponse = await syncKb(kb_id, reference?.datasourceid ?? "");
    console.log("syncKbResponse", syncKbResponse);
    const ref = await deleteRef(tenant.id, refId);

    return {
      document: ref,
      error: null
    };
  } catch (e) {
    console.log(`Not verified: ${e}`);
    return {
      document: null,
      error: e
    };
  }
}

async function deleteFromS3(fileName: string) {
  try {
    if (!fileName) {
      return {
        data: null,
        error: JSON.stringify({ message: "File name is missing" })
      };
    }

    // Prepare the S3 delete parameters
    const deleteParams = {
      Bucket: bucketName,
      Key: fileName
    };

    // Delete the file to S3
    const s3Data = await s3.deleteObject(deleteParams).promise();
    console.log("File deleted to S3", s3Data);

    return {
      data: s3Data,
      error: null
    };
  } catch (e) {
    console.log(`data not deleted to s3: ${e}`);
    return {
      data: null,
      error: e
    };
  }
}
