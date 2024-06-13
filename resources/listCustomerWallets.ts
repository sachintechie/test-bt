import { getCustomerWalletsByTenantUserId, getTransactionsByWalletAddress, getWalletAndTokenByWalletAddress } from "./dbFunctions";
import { tenant } from "./models";

export const handler = async (event: any) => {
    try {
      console.log(event);
  
      const wallets = await listCustomerWallets(
        event.identity.resolverContext as tenant,
        event.arguments?.input?.tenantUserId
      );
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
  
  async function listCustomerWallets(tenant: tenant, tenantUserId: string) {
    console.log("tenantUserId", tenantUserId);
  
    try {
      const wallet = await getCustomerWalletsByTenantUserId(tenantUserId, tenant);
      console.log(wallet, "Wallet");
      return wallet;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

