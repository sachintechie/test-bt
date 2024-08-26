"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const PgClient_1 = require("../db/PgClient");
const handler = async (event) => {
    try {
        console.log("Event", event);
        let token = event.authorizationToken;
        if (token != null) {
            console.log("Token provided", token);
            let query = `SELECT * FROM tenant where apikey = '${token}';`;
            const res = await (0, PgClient_1.executeQuery)(query);
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
        }
        else {
            console.log("No token provided");
            return {
                principalId: "Unauthorized", // The user making the request
                policyDocument: await getPolicyDocument(event, "Deny")
            };
        }
    }
    catch (err) {
        return {
            principalId: "Unauthorized", // The user making the request
            policyDocument: await getPolicyDocument(event, "Deny")
        };
    }
};
exports.handler = handler;
async function getPolicyDocument(event, effect) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpZ2F0ZXdheUF1dGhvcml6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcGlnYXRld2F5QXV0aG9yaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBOEM7QUFFdkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztRQUNyQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLElBQUksS0FBSyxHQUFHLHdDQUF3QyxLQUFLLElBQUksQ0FBQztZQUM5RCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsdUJBQVksRUFBQyxLQUFLLENBQUMsQ0FBQztZQUN0Qyx5QkFBeUI7WUFDekIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3hELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFFL0IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsT0FBTztvQkFDTCxXQUFXLEVBQUUsTUFBTTtvQkFDbkIsY0FBYyxFQUFFLE1BQU0saUJBQWlCLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQztvQkFDdkQsT0FBTyxFQUFFO3dCQUNQLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTt3QkFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7d0JBQ2pCLE1BQU0sRUFBRSxNQUFNLENBQUMsTUFBTTt3QkFDckIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO3dCQUNqQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7d0JBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztxQkFDNUI7aUJBQ0YsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPO2dCQUNMLFdBQVcsRUFBRSxjQUFjLEVBQUUsOEJBQThCO2dCQUMzRCxjQUFjLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO2FBQ3ZELENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNqQyxPQUFPO2dCQUNMLFdBQVcsRUFBRSxjQUFjLEVBQUUsOEJBQThCO2dCQUMzRCxjQUFjLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO2FBQ3ZELENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPO1lBQ0wsV0FBVyxFQUFFLGNBQWMsRUFBRSw4QkFBOEI7WUFDM0QsY0FBYyxFQUFFLE1BQU0saUJBQWlCLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQztTQUN2RCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQTdDVyxRQUFBLE9BQU8sV0E2Q2xCO0FBRUYsS0FBSyxVQUFVLGlCQUFpQixDQUFDLEtBQVUsRUFBRSxNQUFjO0lBQ3pELE1BQU0sY0FBYyxHQUFHO1FBQ3JCLE9BQU8sRUFBRSxZQUFZO1FBQ3JCLFNBQVMsRUFBRTtZQUNUO2dCQUNFLE1BQU0sRUFBRSxvQkFBb0I7Z0JBQzVCLE1BQU0sRUFBRSxNQUFNO2dCQUNkLFFBQVEsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMxQjtTQUNGO0tBQ0YsQ0FBQztJQUNGLE9BQU8sY0FBYyxDQUFDO0FBQ3hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjdXRlUXVlcnkgfSBmcm9tIFwiLi4vZGIvUGdDbGllbnRcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiRXZlbnRcIiwgZXZlbnQpO1xuICAgIGxldCB0b2tlbiA9IGV2ZW50LmF1dGhvcml6YXRpb25Ub2tlbjtcbiAgICBpZiAodG9rZW4gIT0gbnVsbCkge1xuICAgICAgY29uc29sZS5sb2coXCJUb2tlbiBwcm92aWRlZFwiLCB0b2tlbik7XG4gICAgICBsZXQgcXVlcnkgPSBgU0VMRUNUICogRlJPTSB0ZW5hbnQgd2hlcmUgYXBpa2V5ID0gJyR7dG9rZW59JztgO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHJlcy5yb3dzKTtcbiAgICAgIGlmIChyZXMucm93cy5sZW5ndGggPiAwICYmIHJlcy5yb3dzWzBdLmFwaWtleSA9PT0gdG9rZW4pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0ZW5hbnQtaW5zaWUtaWZcIik7XG5cbiAgICAgICAgY29uc3QgdGVuYW50ID0gcmVzLnJvd3NbMF07XG4gICAgICAgIGNvbnNvbGUubG9nKHRlbmFudCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwcmluY2lwYWxJZDogXCJ1c2VyXCIsXG4gICAgICAgICAgcG9saWN5RG9jdW1lbnQ6IGF3YWl0IGdldFBvbGljeURvY3VtZW50KGV2ZW50LCBcIkFsbG93XCIpLFxuICAgICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICAgIGlkOiB0ZW5hbnQuaWQsXG4gICAgICAgICAgICBuYW1lOiB0ZW5hbnQubmFtZSxcbiAgICAgICAgICAgIGFwaWtleTogdGVuYW50LmFwaWtleSxcbiAgICAgICAgICAgIGxvZ286IHRlbmFudC5sb2dvLFxuICAgICAgICAgICAgaXNhY3RpdmU6IHRlbmFudC5pc2FjdGl2ZSxcbiAgICAgICAgICAgIGNyZWF0ZWRhdDogdGVuYW50LmNyZWF0ZWRhdFxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHByaW5jaXBhbElkOiBcIlVuYXV0aG9yaXplZFwiLCAvLyBUaGUgdXNlciBtYWtpbmcgdGhlIHJlcXVlc3RcbiAgICAgICAgcG9saWN5RG9jdW1lbnQ6IGF3YWl0IGdldFBvbGljeURvY3VtZW50KGV2ZW50LCBcIkRlbnlcIilcbiAgICAgIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiTm8gdG9rZW4gcHJvdmlkZWRcIik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBwcmluY2lwYWxJZDogXCJVbmF1dGhvcml6ZWRcIiwgLy8gVGhlIHVzZXIgbWFraW5nIHRoZSByZXF1ZXN0XG4gICAgICAgIHBvbGljeURvY3VtZW50OiBhd2FpdCBnZXRQb2xpY3lEb2N1bWVudChldmVudCwgXCJEZW55XCIpXG4gICAgICB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHByaW5jaXBhbElkOiBcIlVuYXV0aG9yaXplZFwiLCAvLyBUaGUgdXNlciBtYWtpbmcgdGhlIHJlcXVlc3RcbiAgICAgIHBvbGljeURvY3VtZW50OiBhd2FpdCBnZXRQb2xpY3lEb2N1bWVudChldmVudCwgXCJEZW55XCIpXG4gICAgfTtcbiAgfVxufTtcblxuYXN5bmMgZnVuY3Rpb24gZ2V0UG9saWN5RG9jdW1lbnQoZXZlbnQ6IGFueSwgZWZmZWN0OiBzdHJpbmcpIHtcbiAgY29uc3QgcG9saWN5RG9jdW1lbnQgPSB7XG4gICAgVmVyc2lvbjogXCIyMDEyLTEwLTE3XCIsXG4gICAgU3RhdGVtZW50OiBbXG4gICAgICB7XG4gICAgICAgIEFjdGlvbjogXCJleGVjdXRlLWFwaTpJbnZva2VcIixcbiAgICAgICAgRWZmZWN0OiBlZmZlY3QsXG4gICAgICAgIFJlc291cmNlOiBldmVudC5tZXRob2RBcm5cbiAgICAgIH1cbiAgICBdXG4gIH07XG4gIHJldHVybiBwb2xpY3lEb2N1bWVudDtcbn1cbiJdfQ==