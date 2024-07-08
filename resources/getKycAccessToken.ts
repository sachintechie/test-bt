import { generateAccessToken } from "./kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const resp = await generateAccessToken(event.arguments?.input?.customerId, event.arguments?.input?.levelName);

    const response = {
      status:200,
      data: {token : resp.token,customerId : resp.userId},
      error: null
    };
    console.log("generate sumsub token", response);

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