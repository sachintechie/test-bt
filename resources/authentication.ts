import { executeQuery } from "./PgClient";

export const handler = async (event: any) => {
  try {
    console.log("Event", event);
    let token = event.authorizationToken;
    if (token != null) {
      console.log("Token provided", token);
      let query = `SELECT * FROM tenant where api_key = '${token}';`;
      const res = await executeQuery(query);
      // console.log(res.rows);
      if (res.rows.length > 0 && res.rows[0].api_key === token) {
        console.log("tenant-insie-if");

        const tenant = res.rows[0];
        console.log(tenant);

        return {
          isAuthorized: true,
          resolverContext: {
            id: parseInt(tenant.id),
            name: tenant.name,
            api_key: tenant.api_key,
            logo: tenant.logo,
            isactive: tenant.isactive,
            createdat: tenant.createdat,
          },
        };
      }
      return {
        isAuthorized: false,
      };
    } else {
      console.log("No token provided");
      return {
        isAuthorized: false,
      };
    }
  } catch (err) {
    console.log("Disconnected from database.", err);

    return {
      isAuthorized: false,
    };
  } finally {
    console.log("Disconnected from database.");
  }
};
