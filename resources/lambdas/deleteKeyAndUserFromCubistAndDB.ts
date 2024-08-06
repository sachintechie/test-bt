import { deleteCubistUserKey, deleteMasterCubistUser } from "../cubist/CubeSignerClient";
import { getAllCustomerAndWalletByTenant, getTenantCallBackUrl } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    const users = await deleteMasterUserAndWallet();
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

async function deleteMasterUserAndWallet() {
  try {
    // const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a"; //dev
    const schoolhackTenantId = "4a997e70-812f-4c0d-af79-71d0cbb5d562"; //prod
    const tenant = await getTenantCallBackUrl(schoolhackTenantId);
    console.log("Tenant", tenant);
    // const customerWallets = ["User#cf9fc58e-e2c1-4e5b-a2eb-639c3842fdfb","User#f27ffff3-0a6a-4f88-b305-043f08cdb8e8"]
    const customerWallets = ["User#2a088449-8006-4cfa-8b71-ca07e5594e74"];
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
