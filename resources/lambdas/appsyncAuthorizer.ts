import { UserPool } from "aws-cdk-lib/aws-cognito";
import { executeQuery } from "../db/PgClient";
import jwt_decode from "jsonwebtoken";
import { getCustomerIdByTenant } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log("Event", event);
    let token = event.authorizationToken;
    if (token != null) {
      // console.log("Token provided", token);
      let query = `SELECT * FROM tenant where apikey = '${token}';`;
      const res = await executeQuery(query);
      // console.log(res.rows);
      if (res.rows.length > 0 && res.rows[0].apikey === token) {
        console.log("tenant-insie-if");

        const tenant = res.rows[0];
        console.log(tenant);
      if(tenant.iscognitoactive === true){
        let idToken  = event?.requestHeaders?.identity;
        if (idToken == null) {
          return {
            isAuthorized: false
          };
        }
        const decodedToken:any = jwt_decode.decode(idToken);
        const customer = await getCustomerIdByTenant(decodedToken["email"],tenant.id);
        if(customer == null){
          return {
            isAuthorized: false
          };
        }
        else{
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
              usertype : "CUSTOMER",
              customerid: customer.id
            }
          };
        }

      }else{

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
