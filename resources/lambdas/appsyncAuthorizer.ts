import { UserPool } from "aws-cdk-lib/aws-cognito";
import { executeQuery } from "../db/PgClient";
import jwt_decode from "jsonwebtoken";
import { getCustomerIdByTenant } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log("Event", event);
    let token = event.authorizationToken;
    console.log("queryType:" + event.requestContext.querystring.includes("Signin"));

    if (token != null) {
      // console.log("Token provided", token);
      let query = `SELECT * FROM tenant where apikey = '${token}';`;
      const res = await executeQuery(query);
      // console.log(res.rows);
      if (res.rows.length > 0 && res.rows[0].apikey === token) {
        console.log("tenant-inside-if");

        const tenant = res.rows[0];
        console.log(tenant);
        if (tenant.iscognitoactive === true) {
          let idToken = event?.requestHeaders?.identity;
          if (idToken != null) {
            const decodedToken: any = jwt_decode.decode(idToken);
            console.log("Decoded token:", decodedToken);

            if (decodedToken != null && decodedToken["email"] != null) {
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
                const customer = await getCustomerIdByTenant(decodedToken["email"], tenant.id);
                if (customer == null) {
                  console.log("Customer not found");
                  return {
                    isAuthorized: false
                  };
                } else {
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
                      usertype: "CUSTOMER",
                      customerid: customer.id
                    }
                  };
                }
              }
            } else {
              console.log("decoded token null");
              return { isAuthorized: false };
            }
          } else {
            console.log("id token null");
            return {
              isAuthorized: false
            };
          }
        } else {
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
              cognitoclientid: tenant.cognitoclientid
            }
          };
        }
      } else {
        console.log("Api token not matched");
        return { isAuthorized: false };
      }
    } else {
      console.log("No token provided");
      return {
        isAuthorized: false
      };
    }
  } catch (err) {
    console.log("Error", err);
    return {
      isAuthorized: false
    };
  } finally {
    console.log("Disconnected from database.");
  }
};