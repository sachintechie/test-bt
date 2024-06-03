import { SecretsManager } from "@aws-sdk/client-secrets-manager";

import * as cs from "@cubist-labs/cubesigner-sdk";
import { isStale, metadata, type SessionData, type SessionManager, type SessionMetadata } from "@cubist-labs/cubesigner-sdk";
import { getPayerWallet } from "./dbFunctions";

const SECRET_NAME: string = "SchoolHackCubeSignerToken";
const PAYER_SECRET_NAME: string = "SchoolHackGasPayerCubistToken";


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
export async function getCsClient() {
  try {
    const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(SECRET_NAME));
    const org = client.org();
    return { client, org };
  } catch (err) {
    console.error(err);
    throw err;
  }
}


/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getPayerCsSignerKey(chainType: string,tenantId: string) { 
  try{
    console.log("Creating client");
    const payerWallet = await getPayerWallet(chainType,tenantId);
    if(payerWallet == null){
      return {key : null,error: "Payer wallet not found"};
    }
    const client = await cs.CubeSignerClient.create(
      new ReadOnlyAwsSecretsSessionManager(PAYER_SECRET_NAME),
    );
    console.log("Client created",client);
    const keys=await client.sessionKeys();
    const key = keys.filter((key: cs.Key) => key.materialId === payerWallet.walletaddress);
       return {key : key[0],error: null};

  }
  catch(err){
    console.error(err);
    return {key : null,error: "Erorr in creating cubist client for gas payer"};

  }
}

/**
 * Get the CubeSigner key from an OIDC token
 * @param env
 * @param orgId
 * @param oidcToken
 * @param scopes
 */
export async function oidcLogin(env:cs.EnvInterface,orgId: string, oidcToken: string,scopes: any) {
  try {
    console.log("Logging in with OIDC");
    const resp = await cs.CubeSignerClient.createOidcSession(env, orgId, oidcToken, scopes);
    const csClient = await cs.CubeSignerClient.create(resp.data());
    // const keys = await csClient.sessionKeys()
    // console.log("Keys", keys);
    // console.log("Key", keys[0].publicKey.toString());
    // return keys[0]
    return csClient
  }catch(err){
    console.error(err);
    return null;

  }
}



