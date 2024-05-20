import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./models";
import { getCsClient } from "./CubeSignerClient";
import {
  createCustomer,
  createWallet,
  getCustomer,
  getWalletByCustomer,
} from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  GetProgramAccountsFilter,clusterApiUrl,
} from "@solana/web3.js";
const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "http://gamma.signer.cubist.dev",
};
import { SecretsManager } from "aws-sdk";

const secretName = "CubeSignerToken0E1D2960-qP9dUIeYntSs";
const region = "us-east-1";

const client = new SecretsManager({ region: region });

export const handler = async (event: any) => {
  try {
    // console.log(
    //   "Event",ORG_ID,
    //   event.identity,
    //   event.arguments,
    //   event.request.headers.identity
    // );

    const secret = await getSecretValue(secretName);
    console.log("Secret", secret);
    const balance = await getSolBalance("HGRj74N58LwbjSLxQ66UDoZQpLF3mnSve4uJ3xtF6Pg9");
console.log("Balance", balance);
    const wallet = await createUser(
      event.identity as tenant,
      event.arguments?.tenantUserId,
      event.request?.headers?.identity
    );

    return {
      statusCode: 200,
      body: {
        data: event.arguments,
        error: null,
        wallet: wallet,
        balance: balance,
      },
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      statusCode: 400,
      body: {
        data: event.arguments,
        error: err
            },
    };
  }
};

async function getSecretValue(secretName: string) {
  try {
    console.log("Getting secret value", secretName);
    const data = await client
      .getSecretValue({ SecretId: secretName })
      .promise();
    console.log("Secret value", data);
    if ("SecretString" in data) {
      return data.SecretString as string;
    } else {
      let buff = Buffer.from(data.SecretBinary as string, "base64");
      return buff.toString("ascii");
    }
  } catch (err) {
    console.log(err);
    return err;
  }
}

async function createUser(
  tenant: tenant,
  tenantuserid: string,
  oidcToken: string
) {
  console.log("Creating user");

  try {
    // const customer = await getCustomer(tenantuserid, tenant.id);
    // if (customer != null && customer.cubistuserid) {
    //   const wallet = await getWalletByCustomer(tenantuserid, "SOL", tenant);
    //   return {
    //     wallet,
    //     tenantUserId: tenantuserid,
    //   };
    // } else {
      const { client, org } = await getCsClient();
      console.log("Creating user", client);
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
        const org = client.org();
        const cubistUserId = await org.createOidcUser({ iss, sub }, email, {
          name,
        });
        console.log(`Creating key for user ${cubistUserId}...`);

        const customer = await createCustomer({
          emailid: email ? email : "",
          name: name ? name : "",
          tenantuserid,
          tenantid: tenant.id,
          cubistuserid: cubistUserId,
          isactive: true,
          createdat: new Date().toISOString(),
        });

        const wallet = await createWallet(org, cubistUserId, customer);

        return {
          wallet,
          tenantUserId: tenantuserid,
        };
      }
      else{
        const wallet = await getWalletByCustomer(tenantuserid, "SOL", tenant);
        return {
          wallet,
          tenantUserId: tenantuserid,
        };
      }
    // }
  } catch (e) {
    console.log(`Not verified: ${e}`);
    throw e;
  }
}
async function getSolBalance(address: string) {
  try {
    console.log("Address", address);
    const pubkey = new PublicKey(address);
    console.log("pubkey", pubkey);

    const connection = await getSolConnection();
    console.log(connection, "connection");
    console.log(await connection.getBalance(pubkey), "connection");

    const balance = (await connection.getBalance(pubkey)) / LAMPORTS_PER_SOL;
    console.log("Balance", balance);
    return balance;
  } catch (err) {
    console.log(err);
    //throw err;
    return 0;
  }
}

async function getSolConnection() {
  // const connection = new Connection(SOLANA_RPC_PROVIDER, "confirmed");
  const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
  return connection;
}