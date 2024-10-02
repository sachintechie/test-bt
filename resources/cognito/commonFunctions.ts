import { tenant } from "../db/models";
import { CognitoJwtVerifier } from "aws-jwt-verify";

export async function verifyToken(tenant: any, token: string) {
  try {
    if (tenant.userpoolid == null || tenant.cognitoclientid == null) {
      console.log("Tenant does not have userpoolid or cognitoclientid");
      return null;
    }
    const verifier = await getVerifier(tenant.userpoolid, tenant.cognitoclientid);
    const payload = await verifier.verify(
      token // the JWT as string
    );
    console.log("Payload:", payload);
    // const data = {
    //   email: payload.email?.valueOf() == null ? null : payload.email?.valueOf().toString()
    // };
    // console.log("Token is valid. Payload:", data);
    return payload == null ? null : payload;
  } catch (error) {
    console.log("Token not valid!", error);
    return null;
  }
}

async function getVerifier(userPoolId: string, clientId: string) {
  const verifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "id",
    clientId: clientId
  });
  return verifier;
}
