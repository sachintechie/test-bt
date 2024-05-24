import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./models";
import { getCsClient } from "./CubeSignerClient";
import {
  createCustomer,
  createWallet,
  getCustomer,
  getWalletByCustomer,
} from "./dbFunctions";

const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev",
};



export const handler = async (event: any) => {
  try {
    console.log(event);
    //     const secret = await getSecretValue(secretName);
    //     console.log("Secret", secret);
    //     const balance = await getSolBalance("HGRj74N58LwbjSLxQ66UDoZQpLF3mnSve4uJ3xtF6Pg9");
    // console.log("Balance", balance);
    const wallet = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.tenantUserId,
      event.request?.headers?.identity,
      event.arguments?.chainType
    );

    return {
      statusCode: 200,
      body: {
        data: wallet,
        error: null
      },
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      statusCode: 400,
      body: {
        data: null,
        error: err,
      },
    };
  }
};


async function createUser(
  tenant: tenant,
  tenantuserid: string,
  oidcToken: string,
  chainType : string
) {
  console.log("Creating user");

  try {
    console.log("createUser", ORG_ID, tenant.id, tenantuserid, oidcToken);
    const customer = await getCustomer(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      const wallet = await getWalletByCustomer(tenantuserid, chainType, tenant);
      return {
        wallet,
        tenantUserId: tenantuserid,
      };
    } else {
      const { client, org } = await getCsClient();
      console.log("Created cubesigner client", client);
      const proof = await cs.CubeSignerClient.proveOidcIdentity(
        env,
        ORG_ID,
        oidcToken
      );

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
          name,
        });

        console.log(`Creating key for user ${cubistUserId}...`);



        const customerId = await createCustomer({
          emailid: email ? email : "",
          name: name ? name : '',
          tenantuserid,
          tenantid: tenant.id,
          cubistuserid: cubistUserId,
          isactive: true,
          createdat: new Date().toISOString(),
        });
        console.log("Created customer", customerId);

        const wallet = await createWallet(org, cubistUserId, customerId,chainType);

        return {
          wallet,
          tenantUserId: tenantuserid,
        };
      } else {
        const wallet = await getWalletByCustomer(tenantuserid, "Solana", tenant);
        return {
          wallet,
          tenantUserId: tenantuserid,
        };
      }
    }
  } catch (e) {
    console.log(`Not verified: ${e}`);
    throw e;
  }
}

