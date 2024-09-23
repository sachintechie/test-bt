  import { UserPool } from "aws-cdk-lib/aws-cognito";
  import { executeQuery } from "../db/PgClient";
  import jwt_decode from "jsonwebtoken";
  import { getCustomerIdByTenant } from "../db/dbFunctions";

  export const handler = async (event: any) => {
    try {
      let token = event.authorizationToken;
      if (token != null) {
        let query = `SELECT * FROM tenant where apikey = '${token}';`;
        const res = await executeQuery(query);
        console.log(res.rows, " rows");
        if (res.rows.length > 0 && res.rows[0].apikey === token) {
          const tenant = res.rows[0];
          console.log(tenant, " tenant");
        if(tenant.iscognitoactive === true){
          let idToken  = event?.requestHeaders?.identity;
          if (!idToken) {
            return {
              isAuthorized: false
            };
          }
          let decodedToken;
          try {
            decodedToken = jwt_decode.decode(idToken);
            console.log(decodedToken, " decoded Token");
          } catch (err) {
            console.log("JWT Decode Error", err);
            return { isAuthorized: false };
          }
          const customer = await getCustomerIdByTenant(decodedToken["email"], tenant.id);
          if (!customer) {
            return { isAuthorized: false };
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
                usertype : "CUSTOMER",
                customerid: customer.id
              }
            };
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
        else {
          return { isAuthorized: false };
        }
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
    }
  };
