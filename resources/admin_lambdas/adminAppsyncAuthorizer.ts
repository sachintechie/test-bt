import { verifyToken } from "../cognito/commonFunctions";
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
    if (token != null) {
      // Query to check if the token exists in the tenant table
      let query = `SELECT * FROM tenant where apikey = '${token}';`;
      const res = await executeQuery(query);

      // If the token matches a tenant's API key, process further
      if (res.rows.length > 0 && res.rows[0].apikey === token) {
        const tenant = res.rows[0];

        // Handle tenant with active Cognito
        if (tenant.iscognitoactive === true) {
          let idToken = event?.requestHeaders?.identity;

          if (idToken != null) {
            // Check if user has admin-like privileges
            if (await isUserAdminLike(idToken,tenant)) {
              const decodedToken: any = jwt_decode.decode(idToken);
              console.log("Decoded token:", decodedToken);

              if (decodedToken == null || decodedToken["email"] == null) {
                console.log("Invalid ID token");
                return {
                  isAuthorized: false
                };
              } else {
                // Expiration timestamp (in seconds)
                const expireTime = decodedToken["exp"];

                // Convert the expiration timestamp to milliseconds
                const expireTimeInMs = expireTime * 1000;

                // Get the current time in milliseconds
                const currentTime = Date.now();
                // Check if the expiration time has passed
                if (currentTime > expireTimeInMs) {
                  console.log("Token expired");
                  return {
                    isAuthorized: false
                  };
                } else {
                  const adminUser = await getAdminUserByTenant(decodedToken["email"], tenant.id);

                  // If no admin user is found, return unauthorized
                  if (adminUser == null) {
                    console.log("Admin user not found");
                    return { isAuthorized: false };
                  } else {
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
                }
              }
            } else {
              console.log("User is not admin-like");
              // If user is not admin-like, return unauthorized
              return { isAuthorized: false };
            }
          } else {
            console.log("No id token provided");
            return { isAuthorized: false };
          }
        }

        // Handle "OnDemand" tenant
        else if (tenant.name === "OnDemand") {
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
        } else {
          // For other cases, return unauthorized
          return { isAuthorized: false };
        }
      } else {
        console.log("No tenant found");
        // If no tenant matches the token, return unauthorized
        return { isAuthorized: false };
      }
    } else {
      console.log("No token provided");
      return { isAuthorized: false };
    }
  } catch (err) {
    console.error("Error occurred", err);
    return { isAuthorized: false };
  } finally {
    console.log("Execution completed.");
  }
};

// Helper function to check if a user has admin-like privileges
async function isUserAdminLike(idToken: string,tenant: any) {
  try {
    // Decode the ID token
    // const decodedToken: any = jwt_decode.decode(idToken);
    const decodedToken: any = await verifyToken(tenant, idToken);
    console.log("Decoded Token:", decodedToken);
    // if (userData == null || userData.email == null) {
    //   return {
    //     customer: null,
    //     error: "Please provide a valid access token for verification"
    //   };
    // }

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
