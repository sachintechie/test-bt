import { SecretsManager } from "@aws-sdk/client-secrets-manager";

import * as cs from "@cubist-labs/cubesigner-sdk";
import { isStale, metadata, type SessionData, type SessionManager, type SessionMetadata } from "@cubist-labs/cubesigner-sdk";
import { deleteCustomer, deleteWallet, getCubistConfig, getPayerWallet } from "../db/dbFunctions";
import { PublicKey, Transaction } from "@solana/web3.js";

// const SECRET_NAME: string = "SchoolHackCubeSignerToken";
// const PAYER_SECRET_NAME: string = "SchoolHackGasPayerCubistToken";

/**
 * A session manager that reads a token from AWS Secrets Manager.
 */
class ReadOnlyAwsSecretsSessionManager implements SessionManager {
  /** Client for AWS Secrets Manager */
  #sm: SecretsManager;
  /** ID of the secret */
  #secretId: string;
  /** The latest session data retrieved from AWS Secrets Manager */
  #cache?: SessionData;

  /**
   * Get the session data. If the session has not expired, this uses cached information.
   * @return {SessionData} The current session data
   */
  async sessionData(): Promise<SessionData> {
    if (this.#cache !== undefined && !isStale(this.#cache)) {
      return this.#cache;
    }
    const res = await this.#sm.getSecretValue({ SecretId: this.#secretId });
    const decoded = Buffer.from(res.SecretString!, "base64").toString("utf8");
    this.#cache = JSON.parse(decoded) as SessionData;
    return this.#cache;
  }

  /** @inheritdoc */
  async metadata(): Promise<SessionMetadata> {
    const data = await this.sessionData();
    if (isStale(data)) {
      throw new Error("Session is stale");
    }
    return metadata(data);
  }

  /** @inheritdoc */
  async token(): Promise<string> {
    const data = await this.sessionData();
    return data.token;
  }

  /**
   * Constructor.
   * @param {string} secretId The name of the secret holding the token
   */
  constructor(secretId: string) {
    this.#sm = new SecretsManager();
    this.#secretId = secretId;
  }
}

/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getCsClient(teantid: string) {
  try {
    const cubistConfig = await getCubistConfig(teantid);
    const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig?.signersecretname!));
    const org = client.org();
    const orgId = cubistConfig?.orgid;
    return { client, org, orgId };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getCsClientBySecretName(teantid: string,secretName:string) {
  try {
    const cubistConfig = await getCubistConfig(teantid);
    const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(secretName));
    const org = client.org();
    const orgId = cubistConfig?.orgid;
    return { client, org, orgId };
  } catch (err) {
    console.error(err);
    throw err;
  }
}



/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getPayerCsSignerKey(chainType: string, tenantId: string) {
  try {
    console.log("Creating client");
    const cubistConfig = await getCubistConfig(tenantId);
    if (cubistConfig == null) {
      return { key: null, error: "Cubist config not found for this tenant" };
    }
    const payerWallet = await getPayerWallet(chainType, tenantId);
    if (payerWallet == null) {
      return { key: null, error: "Payer wallet not found" };
    }
    const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig.gaspayersecretname));
    console.log("Client created", client);
    const keys = await client.sessionKeys();
    const key = keys.filter((key: cs.Key) => key.materialId === payerWallet.walletaddress);
    return { key: key[0], error: null };
  } catch (err) {
    console.error(err);
    return { key: null, error: "Erorr in creating cubist client for gas payer" };
  }
}

/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function deleteCubistUserKey( tenantId: string,customerWallets:any[]) {
  try {
    const cubistConfig = await getCubistConfig(tenantId);
    if (cubistConfig == null) {
      return { key: null, error: "Cubist config not found for this tenant" };
    }
    const {org} = await getCsClientBySecretName(tenantId,"SchoolHackDeleteUserAndKey");
    const keys = await org.keys();

   const users = await org.users();
   console.log("total org user",users.length,"total org keys",keys.length);

    // const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig.gaspayersecretname));
   // console.log("Client created", client);
   // const keys = await client.sessionKeys();
   let deletedUsers = [];
   for (const customer of customerWallets) {
    const key = keys.filter((key: cs.Key) => key.materialId === customer.walletaddress);
    const user =  users.filter((user )=> user.id === customer.cubistuserid);
    // const key = await cs.CubeSignerKey.get(cubistUserId);
    const deletedKey = await key[0].delete();
    const deletedUser = await org.deleteUser(user[0].id);
    const customerId = await deleteCustomer(customer.customerid,tenantId);
    const walletId = await deleteWallet(customer.customerid,customer.walletaddress);
    deletedUsers.push({customerId,walletId,deletedUser});
    console.log("Deleted user", user);
   }
   

    return {  user : deletedUsers,error: null };
  } catch (err) {
    console.error(err);
    return { key: null, error: "Erorr in creating cubist client for gas payer" };
  }
}

/**
 * Get the CubeSigner key from an OIDC token
 * @param env
 * @param orgId
 * @param oidcToken
 * @param scopes
 */
export async function oidcLogin(env: cs.EnvInterface, orgId: string, oidcToken: string, scopes: any) {
  try {
    console.log("Logging in with OIDC");
    const resp = await cs.CubeSignerClient.createOidcSession(env, orgId, oidcToken, scopes);
    const csClient = await cs.CubeSignerClient.create(resp.data());

    return csClient;
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function getKey(oidcClient: any, chainType: string, cubistUserid: string) {
  try {
    console.log("Getting key", cubistUserid);
    const keys = await oidcClient.sessionKeys();
    const key = await keys.filter((key: cs.Key) => key.cached.owner == cubistUserid && key.cached.key_type == cs.Ed25519.Solana);
    console.log("Key", keys.length, key.length, key[0]);
    return key[0];
  } catch (err) {
    console.error(err);
    return null;
  }
}

export async function signTransaction(transaction: Transaction, key: cs.Key) {
  const base64Payer = transaction.serializeMessage().toString("base64");
  // sign using the well-typed solana end point (which requires a base64 serialized Message)
  const respPayer = await key.signSolana({ message_base64: base64Payer });
  const sigPayer = respPayer.data().signature;
  const sigBytesPayer = Buffer.from(sigPayer.slice(2), "hex");
  transaction.addSignature(new PublicKey(key.materialId), sigBytesPayer);
}

export async function getCubistKey(env: any, cubistOrgId: string,oidcToken:string,scopes: any,walletAddress:string) {
  const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, scopes);
  if (!oidcClient) {
    throw new Error("Please send a valid identity token for verification");
  }
  const keys = await oidcClient.sessionKeys();
  if (keys.length === 0) {
    throw new Error("Given identity token is not the owner of given wallet address");
  }
  const senderKey = keys.filter((key: cs.Key) => key.materialId === walletAddress);
  if (senderKey.length === 0) {
    throw new Error("Given identity token is not the owner of given wallet address");
  }
  return senderKey[0]
}
