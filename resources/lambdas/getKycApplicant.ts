import { getCustomerKyc, getCustomerKycByTenantId, insertCustomerKyc } from "../db/dbFunctions";
import { createApplicant } from "../kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const customerKyc = await getCustomerKycByTenantId(event.arguments?.input?.customerId,event.identity.resolverContext.id);
    console.log("customerKyc", customerKyc);
    if (customerKyc == null || customerKyc == undefined) {
      const sumsubResponse = await createApplicant(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
      console.log("sumsubResponse", sumsubResponse);
      if(sumsubResponse.errorCode == null){
      const userKyc = await insertCustomerKyc(sumsubResponse,"SUMSUB", event.identity.resolverContext.id
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
        status: 400,
        data: null,
        error: sumsubResponse
      };
      console.log("getApplicantDataByExternalId", response);
  
      return response
    }
    }
    else{
    const response = {
      status: 200,
      data: customerKyc,
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
