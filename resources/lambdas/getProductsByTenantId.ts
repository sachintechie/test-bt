import { getProductsByTenantId } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    const productsList = await getProductsByTenantId(
      event.identity.resolverContext.id,
    );
    return {
      status: 200,
      data: productsList,
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
