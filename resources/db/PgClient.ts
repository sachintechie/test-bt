import { Client } from "pg";
import { SecretsManager } from "aws-sdk";

const region = "us-east-1";

const client = new SecretsManager({ region: region });
const dbConfig: any = {
  host: process.env["DB_HOST"]!,
  database: process.env["DB_DATABASE"]!,
  port: parseInt(process.env["DB_PORT"]!)
};
const secretName =process.env["SECRET_NAME"]!;

export async function getDatabaseUrl() {
  const dbSecretString: any = await getSecretValue(secretName);
  const dbSecret = JSON.parse(dbSecretString);
  dbConfig.user = dbSecret.username;
  dbConfig.password = dbSecret.password;
  // url encode the password
  dbConfig.password = encodeURIComponent(dbConfig.password);
  return `postgresql://${dbConfig.user}:${dbConfig.password}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`;
}
export async function executeQuery(query: string) {
  const dbSecretString: any = await getSecretValue(secretName);
  const dbSecret = JSON.parse(dbSecretString);
  dbConfig.user = dbSecret.username;
  dbConfig.password = dbSecret.password;
  const client = new Client(dbConfig);
  console.log('dbConfig', JSON.stringify(dbConfig));
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

export async function getSecretValue(secretName: string) {
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
