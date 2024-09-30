import { createApplicant } from "../kyc/sumsubFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const applicant = await createApplicant(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
    console.log("applicant", applicant);

    const response = {
      status: 200,
      data: applicant,
      error: ""
    };
    console.log("Create sumsub applicant", response);

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
