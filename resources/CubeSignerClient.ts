import { SecretsManager } from "@aws-sdk/client-secrets-manager";
// import { SecretsManager } from 'aws-sdk';

import * as cs from "@cubist-labs/cubesigner-sdk";
import {
  isStale,
  metadata,
  type SessionData,
  type SessionManager,
  type SessionMetadata,
} from "@cubist-labs/cubesigner-sdk";


 const SECRET_NAME: string = "CubeSignerToken0E1D2960-qP9dUIeYntSs";

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
    console.log("Secrets Manager response",this.#cache);

    const res = await this.#sm.getSecretValue({ SecretId: this.#secretId });
    console.log("Secrets Manager response",res);
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
  try{
    console.log("Creating client");
  const client = await cs.CubeSignerClient.create(
    new ReadOnlyAwsSecretsSessionManager(SECRET_NAME),
  );
  console.log("Client created",client);
  const org = client.org();
  return {client,org};
}
catch(err){
  console.error(err);
  throw err;
}
}



