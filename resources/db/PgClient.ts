import { Client } from "pg";
import { SecretsManager } from "aws-sdk";

const region = "us-east-1";

const client = new SecretsManager({ region: region });
const dbConfig: any = {
  host: process.env["DB_HOST"]!,
  database: process.env["DB_DATABASE"]!,
  port: parseInt(process.env["DB_PORT"]!)
};
const secretName = "rds!cluster-e0c060a9-d50c-4c22-8ff5-4596c2b90deb";
export async function executeQuery(query: string) {
  const dbSecretString: any = await getSecretValue(secretName);
  const dbSecret = JSON.parse(dbSecretString);
  dbConfig.user = dbSecret.username;
  dbConfig.password = dbSecret.password;
  const client = new Client(dbConfig);

  try {
    await client.connect();
    const result = await client.query(query);
    return result;
  } catch (e) {
    throw e;
  } finally {
    await client.end();
  }
}

async function getSecretValue(secretName: string) {
  try {
    const data = await client.getSecretValue({ SecretId: secretName }).promise();
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