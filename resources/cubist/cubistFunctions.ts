import { getCubistConfig } from "../db/dbFunctions";
import { deleteCubistUserKey, getCsClient } from "./CubeSignerClient";
import crypto from "crypto";

const cubsitApiEndpoint = process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev";

export async function deleteKeyAndUser(customerWallets: any[], tenant: any) {
  try {
    const cubist = await deleteCubistUserKey(customerWallets, tenant.id);
    if (cubist.user != null) {
      return cubist;
    }

    return null;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getCubistOrgData(tenantId: string) {
  try {
    const cubistConfig = await getCubistConfig(tenantId);
    if (cubistConfig == null) {
      return { key: null, error: "Cubist config not found for this tenant" };
    }
    const { org } = await getCsClient(tenantId);
    if (org != null) {
      const keys = (await org.keys()).length;

      const users = (await org.users()).length;
      console.log("total org user", users, "total org keys", keys);
      return { data: { users, wallets: keys }, error: null };
    } else {
      return { data: null, error: "Error in getting org data" };
    }
  } catch (err) {
    console.error(err);
    return { key: null, error: "Erorr in creating cubist client for gas payer" };
  }
}

export async function sendOidcEmailOtp(emailId: string, tenantId: string) {
  const cubistConfig = await getCubistConfig(tenantId);

  console.log("cubistConfig", cubistConfig);
  if (cubistConfig == null) {
    return { data: null, error: "Cubist config not found for this tenant" };
  } else {
    // const cubistToken: any = await getSecretValue(cubistConfig?.sendtokensecretname);
    // console.log("cubistToken", cubistToken);
    const cubistOrgId = encodeURIComponent(cubistConfig?.orgid);
    const endpoint = `${cubsitApiEndpoint}/v0/org/${cubistOrgId}/oidc/email-otp`;
    console.log("endpoint", endpoint);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
          // Authorization: cubistToken
        },
        body: JSON.stringify({
          email: emailId
        })
      });
      const data = await response.json();
      console.log("data", data);
      if (data.partial_token) {
        return { data, error: null };
      } else {
        return { data: null, error: "Error in sending email otp" };
      }
    } catch (err) {
      console.error(err);
      return { data: null, error: "Error in sending email otp" };
    }
  }
}

export async function decryptToken(reqiv: string, reqkey: string, token: string) {
  try {
    console.log("Generating OIDC Token", reqiv, reqkey, token);
    const tokenData = Buffer.from(token, "base64url");
    const iv = Buffer.from(reqiv, "base64url");
    const keyData = Buffer.from(reqkey, "base64url");
    const key = await crypto.subtle.importKey("raw", keyData, "AES-GCM", false, ["decrypt"]);

    console.log("Decrypting iv", iv);
    console.log("Decrypting key", key);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", length: 256, iv }, key, tokenData);

    // console.log("Decrypted", decrypted);

    const decryptedToken = new TextDecoder("utf-8").decode(decrypted);
    console.log("decryptedToken", decryptedToken);

    return decryptedToken;
  } catch (e) {
    console.log("Error", e);
    return "";
  }
}
