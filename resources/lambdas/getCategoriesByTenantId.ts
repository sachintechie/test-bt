import { getCategoriesByTenantId } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const categories = await getCategoriesByTenantId(
      event.identity.resolverContext.id,
    );
    return {
      status: 200,
      data: categories,
      error: null
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
