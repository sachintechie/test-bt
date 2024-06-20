import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./db/models";
import { getCsClient } from "./cubist/CubeSignerClient";
import {  createWallet, getCustomer, getWalletByCustomer } from "./db/dbFunctions";



export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createCustomerWallet(
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

async function createCustomerWallet(tenant: tenant, tenantuserid: string, chainType: string) {
  console.log("Creating user");

  try {
    console.log("createUser", tenant.id, tenantuserid);
    const customer = await getCustomer(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getWalletByCustomer(tenantuserid, chainType, tenant);
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
          const wallet = await createWallet(org, customer.cubistuserid, chainType,customer?.id );
          if((wallet != null || wallet != undefined) && wallet.data != null){
            wallet.data.tenantuserid = tenantuserid;
            wallet.data.tenantid = tenant.id;
            wallet.data.emailid = customer.emailid;

            return { wallet :wallet.data, error: null };
            }
            else{
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
