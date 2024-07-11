import {
  getAllCustomerAndWalletByTenant,
  getTenantCallBackUrl,
} from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    const users = await deleteUserAndWallet();
    return {
      status: 200,
      data: users,
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

async function deleteUserAndWallet() {
  try {
    const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a";
    const tenant = await getTenantCallBackUrl(schoolhackTenantId);
    console.log("Tenant", tenant);
    const customerWallets = await getAllCustomerAndWalletByTenant(schoolhackTenantId);
    if (customerWallets!= null && customerWallets?.length > 0) {
      //const updatedCustomer = await deleteKeyAndUser(customerWallets, tenant);

      return  {
        status: 200,
        data: null
      };;    }

   
     else {
      return {
        status: 200,
        data: "No Customers Found"
      };
    }

  } catch (err) {
    console.log(err);
    throw err;
  }
}
