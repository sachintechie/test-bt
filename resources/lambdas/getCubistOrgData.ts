import { getCubistOrgData } from "../cubist/cubistFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const data = await getCubistOrgData(event.identity.resolverContext.id);
    return {
      status: data.data != null ? 200 : 400,
      data: data.data,
      error: data.error
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
