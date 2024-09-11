import { executeQuery } from "../db/PgClient";
import jwt_decode from "jsonwebtoken";

const ADMIN_GROUP=process.env["ADMIN_GROUP"];
const ADMIN_ROLE=process.env["ADMIN_ROLE"];

export const handler = async (event: any) => {
  try {
    console.log("Event", event);
    let token = event.authorizationToken;
    let idToken  = event.requestHeaders.identity;

    if (token != null) {
      // console.log("Token provided", token);
      let query = `SELECT * FROM tenant where apikey = '${token}';`;
      const res = await executeQuery(query);
      // console.log(res.rows);
      if (res.rows.length > 0 && res.rows[0].apikey === token) {
        console.log("tenant-insie-if");

        const tenant = res.rows[0];
        console.log(tenant);

        if (await isUserAdminLike(idToken)) {
          return {
            isAuthorized: true,
            resolverContext: {
              id: tenant.id,
              name: tenant.name,
              apikey: tenant.apikey,
              logo: tenant.logo,
              isactive: tenant.isactive,
              createdat: tenant.createdat,
              userpoolid: tenant.userpoolid,
              cognitoclientid: tenant.cognitoclientid,
              userType : "ADMIN"
            }
          };
        }

        return {
          isAuthorized: true,
          resolverContext: {
            id: tenant.id,
            name: tenant.name,
            apikey: tenant.apikey,
            logo: tenant.logo,
            isactive: tenant.isactive,
            createdat: tenant.createdat,
            userpoolid: tenant.userpoolid,
            cognitoclientid: tenant.cognitoclientid,
            userType : "USER"
          }
        };
      }
      return {
        isAuthorized: false
      };
    } else {
      console.log("No token provided");
      return {
        isAuthorized: false
      };
    }
  } catch (err) {
    console.log("Disconnected from database.", err);
    return {
      isAuthorized: false
    };
  } finally {
    console.log("Disconnected from database.");
  }
};

async function isUserAdminLike(idToken: string) {
  try {
    // Decode the ID Token
    const decodedToken:any = jwt_decode.decode(idToken);

    if (!decodedToken) {
      throw new Error("Invalid ID token");
    }

    console.log("Decoded Token: ", decodedToken);

    // Extract Cognito groups (if the user is assigned to a group)
    const cognitoGroups = decodedToken["cognito:groups"]||[];  // Check for Cognito groups
    const cognitoRoles = decodedToken["cognito:roles"]||[];  // Check for custom attributes, if any

    console.log("Cognito Groups:", cognitoGroups);
    console.log("Cognito Role:", cognitoRoles);
    return cognitoGroups.includes(ADMIN_GROUP) || cognitoRoles.includes(ADMIN_ROLE);
  } catch (error) {
    console.error("Error decoding ID token:", error);
  }
}
