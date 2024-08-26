import { tenant } from "@prisma/client";
import { CognitoJwtVerifier } from "aws-jwt-verify";

// // Verifier that expects valid access tokens:
// const verifier = CognitoJwtVerifier.create({
//   userPoolId: "us-east-1_cPBwe0v95",
//   tokenUse: "access",
//   clientId: "3julj8tbdpu0agv5er9agqtg29",
// });

export async function verifyToken(tenant : tenant,token: string) {
console.log("Verifying token", token);
try {
  if(tenant.userpoolid == null || tenant.cognitoclientid == null){
    console.log("Tenant does not have userpoolid or cognitoclientid");
    return null;
  }
    const verifier = await getVerifier(tenant.userpoolid,tenant.cognitoclientid);
  const payload = await verifier.verify(
    token // the JWT as string
  );
  console.log("Token is valid. Payload:", payload);
  return payload;
} catch (error) {
  console.log("Token not valid!",error);
  return null;
}
}

async function getVerifier(userPoolId: string, clientId: string) {
    const verifier = CognitoJwtVerifier.create({
        userPoolId: userPoolId,
        tokenUse: "access",
        clientId: clientId,
      });  
      return verifier;
}