"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const PgClient_1 = require("./PgClient");
const handler = async (event) => {
    try {
        console.log("Event", event);
        let token = event.authorizationToken;
        if (token != null) {
            console.log("Token provided", token);
            let query = `SELECT * FROM tenant where api_key = '${token}';`;
            const res = await (0, PgClient_1.executeQuery)(query);
            // console.log(res.rows);
            if (res.rows.length > 0 && res.rows[0].api_key === token) {
                console.log("tenant-insie-if");
                const tenant = res.rows[0];
                console.log(tenant);
                return {
                    isAuthorized: true,
                    resolverContext: {
                        id: tenant.id,
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
        }
        else {
            console.log("No token provided");
            return {
                isAuthorized: false,
            };
        }
    }
    catch (err) {
        console.log("Disconnected from database.", err);
        return {
            isAuthorized: false,
        };
    }
    finally {
        console.log("Disconnected from database.");
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aGVudGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhdXRoZW50aWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5Q0FBMEM7QUFFbkMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVCLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztRQUNyQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLElBQUksS0FBSyxHQUFHLHlDQUF5QyxLQUFLLElBQUksQ0FBQztZQUMvRCxNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEsdUJBQVksRUFBQyxLQUFLLENBQUMsQ0FBQztZQUN0Qyx5QkFBeUI7WUFDekIsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEtBQUssS0FBSyxFQUFFLENBQUM7Z0JBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsQ0FBQztnQkFFL0IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEIsT0FBTztvQkFDTCxZQUFZLEVBQUUsSUFBSTtvQkFDbEIsZUFBZSxFQUFFO3dCQUNmLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRTt3QkFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7d0JBQ2pCLE9BQU8sRUFBRSxNQUFNLENBQUMsT0FBTzt3QkFDdkIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJO3dCQUNqQixRQUFRLEVBQUUsTUFBTSxDQUFDLFFBQVE7d0JBQ3pCLFNBQVMsRUFBRSxNQUFNLENBQUMsU0FBUztxQkFDNUI7aUJBQ0YsQ0FBQztZQUNKLENBQUM7WUFDRCxPQUFPO2dCQUNMLFlBQVksRUFBRSxLQUFLO2FBQ3BCLENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNqQyxPQUFPO2dCQUNMLFlBQVksRUFBRSxLQUFLO2FBQ3BCLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWhELE9BQU87WUFDTCxZQUFZLEVBQUUsS0FBSztTQUNwQixDQUFDO0lBQ0osQ0FBQztZQUFTLENBQUM7UUFDVCxPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUM7SUFDN0MsQ0FBQztBQUNILENBQUMsQ0FBQztBQTdDVyxRQUFBLE9BQU8sV0E2Q2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlY3V0ZVF1ZXJ5IH0gZnJvbSBcIi4vUGdDbGllbnRcIjtcclxuXHJcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnkpID0+IHtcclxuICB0cnkge1xyXG4gICAgY29uc29sZS5sb2coXCJFdmVudFwiLCBldmVudCk7XHJcbiAgICBsZXQgdG9rZW4gPSBldmVudC5hdXRob3JpemF0aW9uVG9rZW47XHJcbiAgICBpZiAodG9rZW4gIT0gbnVsbCkge1xyXG4gICAgICBjb25zb2xlLmxvZyhcIlRva2VuIHByb3ZpZGVkXCIsIHRva2VuKTtcclxuICAgICAgbGV0IHF1ZXJ5ID0gYFNFTEVDVCAqIEZST00gdGVuYW50IHdoZXJlIGFwaV9rZXkgPSAnJHt0b2tlbn0nO2A7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGV4ZWN1dGVRdWVyeShxdWVyeSk7XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKHJlcy5yb3dzKTtcclxuICAgICAgaWYgKHJlcy5yb3dzLmxlbmd0aCA+IDAgJiYgcmVzLnJvd3NbMF0uYXBpX2tleSA9PT0gdG9rZW4pIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInRlbmFudC1pbnNpZS1pZlwiKTtcclxuXHJcbiAgICAgICAgY29uc3QgdGVuYW50ID0gcmVzLnJvd3NbMF07XHJcbiAgICAgICAgY29uc29sZS5sb2codGVuYW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGlzQXV0aG9yaXplZDogdHJ1ZSxcclxuICAgICAgICAgIHJlc29sdmVyQ29udGV4dDoge1xyXG4gICAgICAgICAgICBpZDogdGVuYW50LmlkLFxyXG4gICAgICAgICAgICBuYW1lOiB0ZW5hbnQubmFtZSxcclxuICAgICAgICAgICAgYXBpX2tleTogdGVuYW50LmFwaV9rZXksXHJcbiAgICAgICAgICAgIGxvZ286IHRlbmFudC5sb2dvLFxyXG4gICAgICAgICAgICBpc2FjdGl2ZTogdGVuYW50LmlzYWN0aXZlLFxyXG4gICAgICAgICAgICBjcmVhdGVkYXQ6IHRlbmFudC5jcmVhdGVkYXQsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBpc0F1dGhvcml6ZWQ6IGZhbHNlLFxyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgY29uc29sZS5sb2coXCJObyB0b2tlbiBwcm92aWRlZFwiKTtcclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICBpc0F1dGhvcml6ZWQ6IGZhbHNlLFxyXG4gICAgICB9O1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWQgZnJvbSBkYXRhYmFzZS5cIiwgZXJyKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBpc0F1dGhvcml6ZWQ6IGZhbHNlLFxyXG4gICAgfTtcclxuICB9IGZpbmFsbHkge1xyXG4gICAgY29uc29sZS5sb2coXCJEaXNjb25uZWN0ZWQgZnJvbSBkYXRhYmFzZS5cIik7XHJcbiAgfVxyXG59O1xyXG4iXX0=