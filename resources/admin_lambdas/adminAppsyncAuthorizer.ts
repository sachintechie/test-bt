// import { verifyToken } from "../cognito/commonFunctions";
// import { getAdminUserByTenant } from "../db/adminDbFunctions";
// import { executeQuery } from "../db/PgClient";

// // Constants for environment variables
// const ADMIN_GROUP = process.env["ADMIN_GROUP"];
// const ADMIN_ROLE = process.env["ADMIN_ROLE"];

// // Lambda handler function
// export const handler = async (event: any) => {
//   try {
//     console.log("Event received", event);

//     let token = event.authorizationToken;

//     // If no token is provided, return unauthorized
//     if (token != null) {
//       // Query to check if the token exists in the tenant table
//       let query = `SELECT * FROM tenant where apikey = '${token}';`;
//       const res = await executeQuery(query);

//       // If the token matches a tenant's API key, process further
//       if (res.rows.length > 0 && res.rows[0].apikey === token) {
//         const tenant = res.rows[0];

//         // Handle tenant with active Cognito
//         if (tenant.iscognitoactive === true) {
//           let idToken = event?.requestHeaders?.identity;

//           if (idToken != null) {
//             const { isAdmin, decodedToken } = await isUserAdminLike(idToken, tenant);
//             // Check if user has admin-like privileges
//             if (isAdmin) {
//               // const decodedToken: any = await verifyToken(tenant, idToken);

//               // const decodedToken: any = jwt_decode.decode(idToken);
//               console.log("Decoded token:", decodedToken);

//               if (decodedToken == null || decodedToken["email"] == null) {
//                 console.log("Invalid ID token");
//                 return {
//                   isAuthorized: false
//                 };
//               } else {
//                 // Expiration timestamp (in seconds)
//                 const expireTime = decodedToken["exp"];

//                 // Convert the expiration timestamp to milliseconds
//                 const expireTimeInMs = expireTime * 1000;

//                 // Get the current time in milliseconds
//                 const currentTime = Date.now();
//                 // Check if the expiration time has passed
//                 if (currentTime > expireTimeInMs) {
//                   console.log("Token expired");
//                   return {
//                     isAuthorized: false
//                   };
//                 } else {
//                   const adminUser = await getAdminUserByTenant(decodedToken["email"], tenant.id);

//                   // If no admin user is found, return unauthorized
//                   if (adminUser == null) {
//                     if (event?.requestContext?.queryString.toString().includes("AdminSignin")) {
//                       return {
//                         isAuthorized: true,
//                         resolverContext: {
//                           id: tenant.id,
//                           name: tenant.name,
//                           apikey: tenant.apikey,
//                           logo: tenant.logo,
//                           isactive: tenant.isactive,
//                           createdat: tenant.createdat,
//                           userpoolid: tenant.userpoolid,
//                           iscognitoactive: tenant.iscognitoactive,
//                           cognitoclientid: tenant.cognitoclientid,
//                           iscubistactive: tenant.iscubistactive,
//                           userType: "ADMIN"
//                         }
//                       };
//                     } else {
//                       console.log("Admin user not found");
//                       return { isAuthorized: false };
//                     }
//                   } else {
//                     // Return authorized response with tenant and user info
//                     return {
//                       isAuthorized: true,
//                       resolverContext: {
//                         id: tenant.id,
//                         name: tenant.name,
//                         apikey: tenant.apikey,
//                         logo: tenant.logo,
//                         isactive: tenant.isactive,
//                         createdat: tenant.createdat,
//                         userpoolid: tenant.userpoolid,
//                         iscognitoactive: tenant.iscognitoactive,
//                         cognitoclientid: tenant.cognitoclientid,
//                         iscubistactive: tenant.iscubistactive,
//                         userType: "ADMIN",
//                         adminuserid: adminUser.id
//                       }
//                     };
//                   }
//                 }
//               }
//             } else {
//               console.log("User is not admin-like");
//               // If user is not admin-like, return unauthorized
//               return { isAuthorized: false };
//             }
//           } else {
//             console.log("No id token provided");
//             return { isAuthorized: false };
//           }
//         }

//         // Handle "OnDemand" tenant
//         else if (tenant.name === "OnDemand") {
//           return {
//             isAuthorized: true,
//             resolverContext: {
//               id: tenant.id,
//               name: tenant.name,
//               apikey: tenant.apikey,
//               logo: tenant.logo,
//               isactive: tenant.isactive,
//               createdat: tenant.createdat,
//               userpoolid: tenant.userpoolid,
//               iscognitoactive: tenant.iscognitoactive,
//               cognitoclientid: tenant.cognitoclientid,
//               iscubistactive: tenant.iscubistactive,
//               userType: "ADMIN"
//             }
//           };
//         } else {
//           // For other cases, return unauthorized
//           return { isAuthorized: false };
//         }
//       } else {
//         console.log("No tenant found");
//         // If no tenant matches the token, return unauthorized
//         return { isAuthorized: false };
//       }
//     } else {
//       console.log("No token provided");
//       return { isAuthorized: false };
//     }
//   } catch (err) {
//     console.error("Error occurred", err);
//     return { isAuthorized: false };
//   } finally {
//     console.log("Execution completed.");
//   }
// };

// // Helper function to check if a user has admin-like privileges
// async function isUserAdminLike(idToken: string, tenant: any) {
//   try {
//     // Decode the ID token
//     // const decodedToken: any = jwt_decode.decode(idToken);
//     const decodedToken: any = await verifyToken(tenant, idToken);
//     console.log("Decoded Token:", decodedToken);

//     if (!decodedToken) throw new Error("Invalid ID token");

//     // Extract Cognito groups and roles
//     const cognitoGroups = decodedToken["cognito:groups"] || [];
//     const cognitoRoles = decodedToken["cognito:roles"] || [];

//     console.log("Decoded Token:", decodedToken);
//     console.log("Cognito Groups:", cognitoGroups);
//     console.log("Cognito Roles:", cognitoRoles);
//     const isAdmin = cognitoGroups.includes(ADMIN_GROUP) || cognitoRoles.includes(ADMIN_ROLE);

//     // Return true if user belongs to the admin group or role
//     return { isAdmin, decodedToken };
//   } catch (error) {
//     console.error("Error decoding ID token:", error);
//     return { isAdmin: false, decodedToken: null };
//   }
// }

import { verifyToken } from "../cognito/commonFunctions";
import { getAdminUserByTenant } from "../db/adminDbFunctions";
import { getCustomerIdByTenant } from "../db/dbFunctions";
import { executeQuery } from "../db/PgClient";

// Constants for environment variables
const ADMIN_GROUP = process.env["ADMIN_GROUP"];
const ADMIN_ROLE = process.env["ADMIN_ROLE"];

// Lambda handler function
export const handler = async (event: any) => {
  try {
    console.log("Event received:", event);
    const token = event.authorizationToken;

    if (!token) {
      console.log("No token provided");
      return { isAuthorized: false };
    }

    const query = `SELECT * FROM tenant WHERE apikey = '${token}';`;
    const res = await executeQuery(query);

    if (!res.rows.length || res.rows[0].apikey !== token) {
      console.log("API token not matched");
      return { isAuthorized: false };
    }

    const tenant = res.rows[0];

    // Handle AI tenants
    if (tenant.name === "AI" || tenant.name === "AI-Dev") {
      return authorizeTenant(tenant, "ADMIN");
    }

    // Handle Cognito active tenant
    if (tenant.iscognitoactive) {
      const idToken = event?.requestHeaders?.identity;

      if (!idToken) {
        console.log("No ID token provided");
        return { isAuthorized: false };
      }

      const { isAdmin, decodedToken } = await isUserAdminLike(idToken, tenant);

      if (isAdmin) {
        return await authorizeAdmin(decodedToken, tenant, event);
      } else {
        return await authorizeCustomer(decodedToken, tenant, event);
      }
    }

    // Handle OnDemand tenant
    if (tenant.name === "OnDemand") {
      return authorizeTenant(tenant, "ADMIN");
    }

    console.log("No matching case for tenant");
    return { isAuthorized: false };

  } catch (err) {
    console.error("Error occurred:", err);
    return { isAuthorized: false };
  } finally {
    console.log("Execution completed.");
  }
};

// Helper to authorize tenant
function authorizeTenant(tenant: any, userType: string) {
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
      iscubistactive: tenant.iscubistactive,
      userType
    }
  };
}

// Helper to authorize admin user
async function authorizeAdmin(decodedToken: any, tenant: any, event: any) {
  if (!decodedToken || !decodedToken["email"]) {
    console.log("Invalid ID token for admin");
    return { isAuthorized: false };
  }

  if (isTokenExpired(decodedToken)) {
    console.log("Admin token expired");
    return { isAuthorized: false };
  }

  const adminUser = await getAdminUserByTenant(decodedToken["email"], tenant.id);

  if (!adminUser) {
    if (event?.requestContext?.queryString.toString().includes("AdminSignin")) {
      return authorizeTenant(tenant, "ADMIN");
    }
    console.log("Admin user not found");
    return { isAuthorized: false };
  }

  return {
    isAuthorized: true,
    resolverContext: {
      ...authorizeTenant(tenant, "ADMIN").resolverContext,
      adminuserid: adminUser.id
    }
  };
}

// Helper to authorize customer user
async function authorizeCustomer(decodedToken: any, tenant: any, event: any) {
  if (!decodedToken || !decodedToken["email"]) {
    console.log("Invalid ID token for customer");
    return { isAuthorized: false };
  }

  if (isTokenExpired(decodedToken)) {
    console.log("Customer token expired");
    return { isAuthorized: false };
  }

  const customer = await getCustomerIdByTenant(decodedToken["email"], tenant.id);

  if (!customer) {
    if (event?.requestContext?.queryString.toString().includes("Signin")) {
      return authorizeTenant(tenant, "CUSTOMER");
    }
    console.log("Customer not found");
    return { isAuthorized: false };
  }

  return {
    isAuthorized: true,
    resolverContext: {
      ...authorizeTenant(tenant, "CUSTOMER").resolverContext,
      customerid: customer.id
    }
  };
}

// Helper function to check if a user has admin-like privileges
async function isUserAdminLike(idToken: string, tenant: any) {
  try {
    const decodedToken: any = await verifyToken(tenant, idToken);
    const cognitoGroups = decodedToken["cognito:groups"] || [];
    const cognitoRoles = decodedToken["cognito:roles"] || [];

    const isAdmin = cognitoGroups.includes(ADMIN_GROUP) || cognitoRoles.includes(ADMIN_ROLE);
    return { isAdmin, decodedToken };
  } catch (error) {
    console.error("Error decoding ID token:", error);
    return { isAdmin: false, decodedToken: null };
  }
}

// Helper function to check if token is expired
function isTokenExpired(decodedToken: any): boolean {
  const expireTimeInMs = decodedToken["exp"] * 1000;
  return Date.now() > expireTimeInMs;
}

