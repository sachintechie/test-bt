"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const PgClient_1 = require("../db/PgClient");
const handler = async (event) => {
    try {
        console.log("Event", event);
        let token = event.authorizationToken;
        if (token != null) {
            // console.log("Token provided", token);
            let query = `SELECT * FROM tenant where apikey = '${token}';`;
            const res = await (0, PgClient_1.executeQuery)(query);
            // console.log(res.rows);
            if (res.rows.length > 0 && res.rows[0].apikey === token) {
                console.log("tenant-insie-if");
                const tenant = res.rows[0];
                console.log(tenant);
                return {
                    isAuthorized: true,
                    resolverContext: {
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
                isAuthorized: false
            };
        }
        else {
            console.log("No token provided");
            return {
                isAuthorized: false
            };
        }
    }
    catch (err) {
        console.log("Disconnected from database.", err);
        return {
            isAuthorized: false
        };
    }
    finally {
        console.log("Disconnected from database.");
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwc3luY0F1dGhvcml6ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhcHBzeW5jQXV0aG9yaXplci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBOEM7QUFFdkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztRQUNyQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNsQix3Q0FBd0M7WUFDeEMsSUFBSSxLQUFLLEdBQUcsd0NBQXdDLEtBQUssSUFBSSxDQUFDO1lBQzlELE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSx1QkFBWSxFQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3RDLHlCQUF5QjtZQUN6QixJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sS0FBSyxLQUFLLEVBQUUsQ0FBQztnQkFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUUvQixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUVwQixPQUFPO29CQUNMLFlBQVksRUFBRSxJQUFJO29CQUNsQixlQUFlLEVBQUU7d0JBQ2YsRUFBRSxFQUFFLE1BQU0sQ0FBQyxFQUFFO3dCQUNiLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSTt3QkFDakIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNO3dCQUNyQixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7d0JBQ2pCLFFBQVEsRUFBRSxNQUFNLENBQUMsUUFBUTt3QkFDekIsU0FBUyxFQUFFLE1BQU0sQ0FBQyxTQUFTO3FCQUM1QjtpQkFDRixDQUFDO1lBQ0osQ0FBQztZQUNELE9BQU87Z0JBQ0wsWUFBWSxFQUFFLEtBQUs7YUFDcEIsQ0FBQztRQUNKLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pDLE9BQU87Z0JBQ0wsWUFBWSxFQUFFLEtBQUs7YUFDcEIsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFaEQsT0FBTztZQUNMLFlBQVksRUFBRSxLQUFLO1NBQ3BCLENBQUM7SUFDSixDQUFDO1lBQVMsQ0FBQztRQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUM3QyxDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBN0NXLFFBQUEsT0FBTyxXQTZDbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjdXRlUXVlcnkgfSBmcm9tIFwiLi4vZGIvUGdDbGllbnRcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiRXZlbnRcIiwgZXZlbnQpO1xuICAgIGxldCB0b2tlbiA9IGV2ZW50LmF1dGhvcml6YXRpb25Ub2tlbjtcbiAgICBpZiAodG9rZW4gIT0gbnVsbCkge1xuICAgICAgLy8gY29uc29sZS5sb2coXCJUb2tlbiBwcm92aWRlZFwiLCB0b2tlbik7XG4gICAgICBsZXQgcXVlcnkgPSBgU0VMRUNUICogRlJPTSB0ZW5hbnQgd2hlcmUgYXBpa2V5ID0gJyR7dG9rZW59JztgO1xuICAgICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcbiAgICAgIC8vIGNvbnNvbGUubG9nKHJlcy5yb3dzKTtcbiAgICAgIGlmIChyZXMucm93cy5sZW5ndGggPiAwICYmIHJlcy5yb3dzWzBdLmFwaWtleSA9PT0gdG9rZW4pIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJ0ZW5hbnQtaW5zaWUtaWZcIik7XG5cbiAgICAgICAgY29uc3QgdGVuYW50ID0gcmVzLnJvd3NbMF07XG4gICAgICAgIGNvbnNvbGUubG9nKHRlbmFudCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpc0F1dGhvcml6ZWQ6IHRydWUsXG4gICAgICAgICAgcmVzb2x2ZXJDb250ZXh0OiB7XG4gICAgICAgICAgICBpZDogdGVuYW50LmlkLFxuICAgICAgICAgICAgbmFtZTogdGVuYW50Lm5hbWUsXG4gICAgICAgICAgICBhcGlrZXk6IHRlbmFudC5hcGlrZXksXG4gICAgICAgICAgICBsb2dvOiB0ZW5hbnQubG9nbyxcbiAgICAgICAgICAgIGlzYWN0aXZlOiB0ZW5hbnQuaXNhY3RpdmUsXG4gICAgICAgICAgICBjcmVhdGVkYXQ6IHRlbmFudC5jcmVhdGVkYXRcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge1xuICAgICAgICBpc0F1dGhvcml6ZWQ6IGZhbHNlXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhcIk5vIHRva2VuIHByb3ZpZGVkXCIpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaXNBdXRob3JpemVkOiBmYWxzZVxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiRGlzY29ubmVjdGVkIGZyb20gZGF0YWJhc2UuXCIsIGVycik7XG5cbiAgICByZXR1cm4ge1xuICAgICAgaXNBdXRob3JpemVkOiBmYWxzZVxuICAgIH07XG4gIH0gZmluYWxseSB7XG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWQgZnJvbSBkYXRhYmFzZS5cIik7XG4gIH1cbn07XG4iXX0=