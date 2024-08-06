import { deleteCubistUserKey, deleteMasterCubistUser } from "../cubist/CubeSignerClient";
import { getAllCustomerAndWalletByTenant, getTenantCallBackUrl } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    const users = await deleteMasterUserAndWallet(event.arguments.customerWallets);
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

async function deleteMasterUserAndWallet(customerWallets : string[]) {
  try {
    // const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a"; //dev
    const schoolhackTenantId = "4a997e70-812f-4c0d-af79-71d0cbb5d562"; //prod
    const tenant = await getTenantCallBackUrl(schoolhackTenantId);
    console.log("Tenant", tenant);

    if (tenant != null && customerWallets != null && customerWallets?.length > 0) {
      const updatedCustomer = await deleteMasterCubistUser(customerWallets, tenant.id);
      return {
        status: 200,
        data: updatedCustomer
      };
    } else {
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

async function deleteUserAndWallet() {
  try {
    const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a";
    const tenant = await getTenantCallBackUrl(schoolhackTenantId);
    console.log("Tenant", tenant);
    const customerWallets = await getAllCustomerAndWalletByTenant(schoolhackTenantId);

    if (tenant != null && customerWallets != null && customerWallets?.length > 0) {
      const updatedCustomer = await deleteCubistUserKey(customerWallets, tenant.id);

      return {
        status: 200,
        data: null
      };
    } else {
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
