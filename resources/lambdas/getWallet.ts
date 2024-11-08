import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { getCsClient, getKey, oidcLogin } from "../cubist/CubeSignerClient";
import { createCustomer, createWalletAndKey, getCustomerAndWallet } from "../db/dbFunctions";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export const handler = async (event: any, context: any) => {
  try {
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
  try {
    const isExist = await checkCustomerAndWallet(tenantuserid, tenant, chainType, oidcToken);
    if (isExist != null) {
      return isExist;
    } else {
      if (!oidcToken) {
        return {
          wallet: null,
          error: "Please provide an identity token for verification"
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
          var cubistUserId = "";
          // If user does not exist, create it
          if (!proof.user_info?.user_id) {
            console.log(`Creating OIDC user ${email}`);
            cubistUserId = await org.createOidcUser({ iss, sub }, email, {
              name
            });
          } else {
            cubistUserId = proof.user_info?.user_id;
          }
          console.log(`Creating key for user ${cubistUserId}...`);
          var wallet = await createCustomerAndWallet(
            cubistUserId,
            email || "",
            name || "",
            tenantuserid,
            oidcToken,
            iss,
            chainType,
            tenant
          );
          return wallet;
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

async function createCustomerAndWallet(
  cubistUserId: string,
  email: string,
  name: string,
  tenantuserid: string,
  oidcToken: string,
  iss: string,
  chainType: string,
  tenant: tenant
) {
  try {
    console.log(`Creating key for user ${cubistUserId}...`);

    const customer = await createCustomer({
      emailid: email ? email : "",
      name: name ? name : "----",
      tenantuserid,
      tenantid: tenant.id,
      cubistuserid: cubistUserId,
      isactive: true,
      isBonusCredit: false,
      iss: iss,
      createdat: new Date().toISOString()
    });
    console.log("Created customer", customer.id);

    const wallet = await createWalletByKey(tenant, tenantuserid, oidcToken, chainType, customer);
    console.log("Created wallet", wallet);
    return wallet;
  } catch (e) {
    return {
      wallet: null,
      error: e
    };
  }
}

async function createWalletByKey(tenant: tenant, tenantuserid: string, oidcToken: string, chainType: string, customer: any) {
  try {
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
    return { wallet: newWallet, error: null };
  } catch (e) {
    return {
      wallet: null,
      error: e
    };
  }
}

async function checkCustomerAndWallet(tenantuserid: string, tenant: tenant, chainType: string, oidcToken: string) {
  // check if customer exists
  // check if wallet exists
  // if wallet exists return wallet
  // if wallet does not exist create wallet
  // return wallet
  try {
    const customerAndWallet = await getCustomerAndWallet(tenantuserid, chainType, tenant);
    if (customerAndWallet != null) {
      if (
        customerAndWallet.wallets.length > 0 &&
        customerAndWallet?.wallets[0].walletaddress != null &&
        customerAndWallet.wallets[0].chaintype == chainType
      ) {
        const newWallet = {
          walletaddress: customerAndWallet.wallets[0].walletaddress,
          createdat: customerAndWallet.wallets[0].createdat,
          chaintype: customerAndWallet.wallets[0].chaintype,
          tenantuserid: tenantuserid,
          tenantid: tenant.id,
          emailid: customerAndWallet.emailid,
          customerid: customerAndWallet.id
        };
        return { wallet: newWallet, error: null };
      } else {
        const wallet = createWalletByKey(tenant, tenantuserid, oidcToken, chainType, customerAndWallet);
        return wallet;
      }
    } else {
      return null;
    }
  } catch (e) {
    return null;
  }
}
