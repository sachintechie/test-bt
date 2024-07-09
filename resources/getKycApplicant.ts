import { insertCustomerKyc } from "./db/dbFunctions";
import { createApplicant, getApplicantDataByExternalId } from "./kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    let resp;

    resp = await getApplicantDataByExternalId(event.arguments?.input?.customerId);
    console.log("resp", resp);
    if (resp.code == 404) {
      resp = await createApplicant(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
      const userKyc = await insertCustomerKyc(resp,"SUMSUB", event.identity.resolverContext.id
      );
      const response = {
        status: 200,
        data: userKyc,
        error: null
      };
      console.log("getApplicantDataByExternalId", response);
  
      return response;
    }
    else{
    const response = {
      status: 200,
      data: resp,
      error: null
    };
    console.log("getApplicantDataByExternalId", response);

    return response;
  }
  } catch (err: any) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
