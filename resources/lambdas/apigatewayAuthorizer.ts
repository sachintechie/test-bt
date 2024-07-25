import { executeQuery } from "../db/PgClient";

export const handler = async (event: any) => {
  try {
    console.log("Event", event);
    let token = event.authorizationToken;
    if (token != null) {
      console.log("Token provided", token);
      let query = `SELECT * FROM tenant where apikey = '${token}';`;
      const res = await executeQuery(query);
      // console.log(res.rows);
      if (res.rows.length > 0 && res.rows[0].apikey === token) {
        console.log("tenant-insie-if");

        const tenant = res.rows[0];
        console.log(tenant);

        return {
          principalId: "user",
          policyDocument: await getPolicyDocument(event, "Allow"),
          context: {
            id: tenant.id,
            name: tenant.name,
            apikey: tenant.apikey,
            logo: tenant.logo,
            isactive: tenant.isactive,
            createdat: tenant.createdat
          }
        };
      }
      return {
        principalId: "Unauthorized", // The user making the request
        policyDocument: await getPolicyDocument(event, "Deny")
      };
    } else {
      console.log("No token provided");
      return {
        principalId: "Unauthorized", // The user making the request
        policyDocument: await getPolicyDocument(event, "Deny")
      };
    }
  } catch (err) {
    return {
      principalId: "Unauthorized", // The user making the request
      policyDocument: await getPolicyDocument(event, "Deny")
    };
  }
};

async function getPolicyDocument(event: any, effect: string) {
  const policyDocument = {
    Version: "2012-10-17",
    Statement: [
      {
        Action: "execute-api:Invoke",
        Effect: effect,
        Resource: event.methodArn
      }
    ]
  };
  return policyDocument;
}
