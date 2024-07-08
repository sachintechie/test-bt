import { generateAccessToken, getApplicantDataByExternalId } from "./kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const resp = await getApplicantDataByExternalId(event.arguments?.input?.customerId);
console.log("resp",resp);
let response;
if(resp.code == 404){
     response = {
      status: resp.code == 200 ? 200 : resp.code,
      data: resp.code == 200 ? resp.data : null,
      error: resp.code == 200 ? "" : resp.description
    };
  }else{
     response = {
      status: 200,
      data: resp,
      error: null
    };
  }
    console.log("getApplicantDataByExternalId", response);

    return response;
  } catch (err: any) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};