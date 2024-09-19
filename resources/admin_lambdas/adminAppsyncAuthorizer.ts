import { getAdminUserByTenant } from "../db/adminDbFunctions";
import { executeQuery } from "../db/PgClient";
import jwt_decode from "jsonwebtoken";

// Constants for environment variables
const ADMIN_GROUP = process.env["ADMIN_GROUP"];
const ADMIN_ROLE = process.env["ADMIN_ROLE"];

// Lambda handler function
export const handler = async (event: any) => {
  try {
    console.log("Event received", event);
    
    let token = event.authorizationToken;

    // If no token is provided, return unauthorized
    if (token == null) {
      console.log("No token provided");
      return { isAuthorized: false };
    }

    // Query to check if the token exists in the tenant table
    let query = `SELECT * FROM tenant where apikey = '${token}';`;
    const res = await executeQuery(query);

    // If the token matches a tenant's API key, process further
    if (res.rows.length > 0 && res.rows[0].apikey === token) {
      const tenant = res.rows[0];

      // Handle tenant with active Cognito
      if (tenant.iscognitoactive === true) {
        let idToken  = event?.requestHeaders?.identity;

        if (idToken == null) return { isAuthorized: false };

        // Check if user has admin-like privileges
        if (await isUserAdminLike(idToken)) {
          const decodedToken: any = jwt_decode.decode(idToken);
          const adminUser = await getAdminUserByTenant(decodedToken["email"], tenant.id);

          // If no admin user is found, return unauthorized
          if (adminUser == null) return { isAuthorized: false };

          // Return authorized response with tenant and user info
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
              iscognitoactive: tenant.iscognitoactive,
              cognitoclientid: tenant.cognitoclientid,
              userType: "ADMIN",
              adminUserId: adminUser.id
            }
          };
        }
        // If user is not admin-like, return unauthorized
        return { isAuthorized: false };
      } 

      // Handle "OnDemand" tenant
      if (tenant.name === "OnDemand") {
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
            iscognitoactive: tenant.iscognitoactive,
            cognitoclientid: tenant.cognitoclientid,
            userType: "ADMIN"
          }
        };
      }

      // For other cases, return unauthorized
      return { isAuthorized: false };
    }

    // If no tenant matches the token, return unauthorized
    return { isAuthorized: false };
    
  } catch (err) {
    console.error("Error occurred", err);
    return { isAuthorized: false };
  } finally {
    console.log("Execution completed.");
  }
};

// Helper function to check if a user has admin-like privileges
async function isUserAdminLike(idToken: string) {
  try {
    // Decode the ID token
    const decodedToken: any = jwt_decode.decode(idToken);

    if (!decodedToken) throw new Error("Invalid ID token");

    // Extract Cognito groups and roles
    const cognitoGroups = decodedToken["cognito:groups"] || [];
    const cognitoRoles = decodedToken["cognito:roles"] || [];

    console.log("Decoded Token:", decodedToken);
    console.log("Cognito Groups:", cognitoGroups);
    console.log("Cognito Roles:", cognitoRoles);

    // Return true if user belongs to the admin group or role
    return cognitoGroups.includes(ADMIN_GROUP) || cognitoRoles.includes(ADMIN_ROLE);
    
  } catch (error) {
    console.error("Error decoding ID token:", error);
    return false;
  }
}
