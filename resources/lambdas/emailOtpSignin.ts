import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { getCsClient, getKey, oidcLogin } from "../cubist/CubeSignerClient";
import {  createWalletAndKey, getEmailOtpCustomer, updateCustomerCubistData } from "../db/dbFunctions";


const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createCubistUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.headers?.identity,
      event.arguments?.input?.emailid
    );

    const response = {
      status: data.wallet != null ? 200 : 400,
      data: data.wallet,
      error: data.error
    };
    console.log("customer", response);

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




async function createCubistUser(tenant: tenant, tenantuserid: string, token: BufferSource, chainType: string) {
  try {
    const customer = await getEmailOtpCustomer(tenantuserid, tenant.id);
if (customer == null || customer?.id == null || customer?.iv == null || customer?.key == null) {
return {  wallet: null, error: "Please do the registration first" };
}
  
      if (!token) {
        return {
          wallet: null,
          error: "Please provide an identity token for verification"
        };
      } else {
        try {
          const oidcToken = await decryptToken(customer?.iv, customer?.key, token);
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
            customer.id,
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
  customerId: string,
  tenant: tenant
) {
  try{
  console.log(`Creating key for user ${cubistUserId}...`);

  const customer = await updateCustomerCubistData({
    emailid: email ? email : "",
    cubistuserid: cubistUserId,
    iss: iss,
    id:customerId

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
  try{
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

async function decryptToken(reqiv:string,reqkey:string,tokenData:BufferSource){
  try {
    console.log("Generating OIDC Token", reqiv, reqkey, tokenData);

    const iv = Buffer.from(reqiv, "base64url");
    const keyData = Buffer.from(reqkey, "base64url");
    const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);

    console.log("Decrypting iv", iv);
    console.log("Decrypting key", key);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", length: 256, iv }, key, tokenData);

    console.log("Decrypted", decrypted);

    const decryptedToken = new TextDecoder("utf-8").decode(decrypted);
    return decryptedToken;
  } catch (e) {
    console.log("Error", e);
    throw e;
  }

}