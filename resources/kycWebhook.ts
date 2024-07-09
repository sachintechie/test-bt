import { sumsubWebhookListener } from "./kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    console.log("event", event);

    const resp = await sumsubWebhookListener(event);
    
    const response = {
      status: 200,
      data: resp,
      error: ""
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