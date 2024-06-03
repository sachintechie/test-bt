import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./models";
import { getCsClient } from "./CubeSignerClient";
import { createCustomer, createWallet, getCustomer, getWalletByCustomer } from "./dbFunctions";

const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.request?.headers?.identity,
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

async function createUser(tenant: tenant, tenantuserid: string, oidcToken: string, chainType: string) {
  console.log("Creating user");

  try {
    console.log("createUser", ORG_ID, tenant.id, tenantuserid);
    const customer = await getCustomer(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getWalletByCustomer(tenantuserid, chainType, tenant);
      if (wallet != null && wallet != undefined) {
        return { wallet, error: null };
      } else {
        return {
          wallet: null,
          error: "Wallet not found for the given tenantuserid and chainType"
        };
      }
    } else {
      if (!oidcToken) {
        return {
          wallet: null,
          error: "Please send a valid identity token for verification"
        };
      } else {
        try {
          const { client, org } = await getCsClient();
          if(client == null || org == null) {
            return {
              wallet: null,
              error: "Error creating cubesigner client"
            };
          }
          console.log("Created cubesigner client", client);
          const proof = await cs.CubeSignerClient.proveOidcIdentity(env, ORG_ID, oidcToken);

          console.log("Verifying identity", proof);

          await org.verifyIdentity(proof);

          console.log("Verified");

          //assert(proof.identity, "Identity should be set when proof is obtained using OIDC token");
          const iss = proof.identity!.iss;
          const sub = proof.identity!.sub;
          const email = proof.email;
          const name = proof.preferred_username;

          // If user does not exist, create it
          if (!proof.user_info?.user_id) {
            console.log(`Creating OIDC user ${email}`);
            const cubistUserId = await org.createOidcUser({ iss, sub }, email, {
              name
            });

            console.log(`Creating key for user ${cubistUserId}...`);

            const customerId = await createCustomer({
              emailid: email ? email : "",
              name: name ? name : "----",
              tenantuserid,
              tenantid: tenant.id,
              cubistuserid: cubistUserId,
              isactive: true,
              createdat: new Date().toISOString()
            });
            console.log("Created customer", customerId);

            const wallet = await createWallet(org, cubistUserId, customerId, chainType);
            wallet.tenantuserid = tenantuserid;
            wallet.tenantid = tenant.id;
            wallet.emailid = email;

            return { wallet, error: null };
          } else {
            const wallet = await getWalletByCustomer(tenantuserid, chainType, tenant);
            if (wallet != null && wallet != undefined) {
              return { wallet, error: null };
            } else {
              return {
                wallet: null,
                error: "Wallet not found for the given tenantuserid and chainType"
              };
            }
          }
        } catch (e) {
          console.log(`Not verified: ${e}`);
          return {
            wallet: null,
            error: "Please send a valid identity token for verification"
          };
        }
      }
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}
