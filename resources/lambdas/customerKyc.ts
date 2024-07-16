import {  getCustomerKycByTenantId } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const wallets = await getCustomerKycByTenantId( event.arguments?.input?.customerId,event.identity.resolverContext.id,);
    return {
      status: 200,
      data: wallets,
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

