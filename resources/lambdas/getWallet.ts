import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { getCsClient, getKey, oidcLogin } from "../cubist/CubeSignerClient";
import { createCustomer, createWallet, createWalletAndKey, getCustomer, getWalletByCustomer } from "../db/dbFunctions";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};


export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);
    console.log('DATABASE_URL',process.env.DATABASE_URL)
    const data = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.headers?.identity,
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
    console.log("createUser", tenant.id, tenantuserid, chainType);
    const customer = await getCustomer(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getWalletByCustomer(tenantuserid, chainType, tenant);
      if (wallet != null && wallet != undefined) {
        console.log("Wallet found", wallet);
        return { wallet, error: null };
      } else {
        const { org, orgId } = await getCsClient(tenant.id);
     
        const oidcClient = await oidcLogin(env, orgId || "", oidcToken, ["sign:*"]);
        const cubistUser = await oidcClient?.user();
        console.log("Created cubesigner user", oidcClient, cubistUser);
        if (oidcClient == null || (cubistUser != null && cubistUser.email != customer.emailid)) {
          return {
            wallet: null,
            error: "Please send a valid identity token for given tenantuserid"
          };
        }
        const key = await getKey(oidcClient, chainType, customer.cubistuserid);
        console.log("getKey cubesigner user", key, customer.cubistuserid);

        const wallet = await createWalletAndKey(org, customer.cubistuserid, chainType, customer.id, key);
        const newWallet = { 
          walletaddress: wallet.data.walletaddress,
          createdat: wallet.data.createdat,
          chaintype: wallet.data.chaintype,
          tenantuserid: tenantuserid,
          tenantid: tenant.id,
          emailid: customer.emailid,
          customerid: customer.id
        };
        
  

        return { newWallet, error: null };

        // return {
        //   wallet: null,
        //   error: "Wallet not found for the given tenantuserid and chainType"
        // };
      }
    } else {
      if (!oidcToken) {
        return {
          wallet: null,
          error: "Please send a valid identity token for verification"
        };
      } else {
        try {
          const { client, org, orgId } = await getCsClient(tenant.id);
          if (client == null || org == null) {
            return {
              wallet: null,
              error: "Error creating cubesigner client"
            };
          }
          console.log("Created cubesigner client", client);
          const proof = await cs.CubeSignerClient.proveOidcIdentity(env, orgId || "", oidcToken);

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
            org.deleteUser("nnbnb");
            4;
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
              isBonusCredit: false,
              createdat: new Date().toISOString()
            });
            console.log("Created customer", customerId);

            const wallet = await createWallet(org, cubistUserId, chainType, customerId);
            if ((wallet != null || wallet != undefined) && wallet.data != null) {
            const newWallet = {
              walletaddress: wallet.data.walletaddress,
              createdat: wallet.data.createdat,
              chaintype: wallet.data.chaintype,
              tenantuserid: tenantuserid,
              tenantid: tenant.id,
              emailid: email,
              customerid: customerId
            };
            

              return { wallet: newWallet, error: null };
            } else {
              return {
                wallet: null,
                error: wallet.error
              };
            }
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
