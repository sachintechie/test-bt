import { tenant } from "../db/models";
import { getCsClient } from "../cubist/CubeSignerClient";
import { createAdminWallet, getAdminUser, getAdminWalletByAdmin } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createAdminUserWallet(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.arguments?.input?.chainType
    );

    const response = {
      status: data.wallet != null ? 200 : 400,
      data: data.wallet,
      error: data.error
    };
    console.log("Wallet", response);

    return response;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function createAdminUserWallet(tenant: tenant, tenantuserid: string, chainType: string) {
  console.log("Creating user");

  try {
    console.log("createUser", tenant.id, tenantuserid);
    const customer = await getAdminUser(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getAdminWalletByAdmin(tenantuserid, chainType, tenant);
      if (wallet != null && wallet != undefined) {
        return { wallet, error: null };
      } else {
        try {
          const { client, org } = await getCsClient(tenant.id);
          console.log("Created cubesigner client", client);

          if (client == null || org == null) {
            return {
              wallet: null,
              error: "Error creating cubesigner client"
            };
          }
          const wallet = await createAdminWallet(org, customer.cubistuserid, chainType, tenant.id, customer?.id);
          if ((wallet != null || wallet != undefined) && wallet.data != null) {
            const newWallet = {
              walletaddress: wallet.data.walletaddress,
              createdat: wallet.data.createdat,
              chaintype: wallet.data.chaintype,
              tenantuserid: tenantuserid,
              tenantid: tenant.id,
              emailid: customer.emailid,
              customerid: customer.id
            };

            return { wallet: newWallet, error: null };
          } else {
            return {
              wallet: null,
              error: wallet.error
            };
          }
        } catch (e) {
          console.log(`Not verified: ${e}`);
          return {
            wallet: null,
            error: "Please send a valid identity token for verification"
          };
        }
      }
    } else {
      return {
        wallet: null,
        error: "Create cubist user first"
      };
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}
