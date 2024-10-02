import { tenant } from "../db/models";
import { getCsClient } from "../cubist/CubeSignerClient";
import { createWallet, getCustomer, getWalletByCustomer } from "../db/dbFunctions";
import { verifyToken } from "../cognito/commonFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createCustomerWallet(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.chainType,
      event.headers?.identity
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

async function createCustomerWallet(tenant: tenant, chainType: string, oidcToken: string) {
  console.log("Creating user");

  try {
    console.log("createUser", tenant.id);
    const userData = await verifyToken(tenant, oidcToken);
    if (userData == null || userData.email == null) {
      return {
        customer: null,
        error: "Please provide a valid access token for verification"
      };
    }
    console.log("createUser", tenant.id, userData.email);
    const customer = await getCustomer(userData.email.toString(), tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getWalletByCustomer(userData.email.toString(), chainType, tenant);
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
          const wallet = await createWallet(org, customer.cubistuserid, chainType, customer?.id);
          if ((wallet != null || wallet != undefined) && wallet.data != null) {
            const newWallet = {
              walletaddress: wallet.data.walletaddress,
              createdat: wallet.data.createdat,
              chaintype: wallet.data.chaintype,
              tenantuserid: userData.email,
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
