import { CognitoJwtVerifier } from "aws-jwt-verify";

// Verifier that expects valid access tokens:
const verifier = CognitoJwtVerifier.create({
  userPoolId: "bt42-staging",
  tokenUse: "access",
  clientId: "3julj8tbdpu0agv5er9agqtg29",
});

export async function verifyToken(token: string) {
console.log("Verifying token", token);
try {
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