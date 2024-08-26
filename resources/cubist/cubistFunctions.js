"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteKeyAndUser = deleteKeyAndUser;
exports.getCubistOrgData = getCubistOrgData;
const dbFunctions_1 = require("../db/dbFunctions");
const CubeSignerClient_1 = require("./CubeSignerClient");
async function deleteKeyAndUser(customerWallets, tenant) {
    try {
        const cubist = await (0, CubeSignerClient_1.deleteCubistUserKey)(customerWallets, tenant.id);
        if (cubist.user != null) {
            return cubist;
        }
        return null;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
async function getCubistOrgData(tenantId) {
    try {
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenantId);
        if (cubistConfig == null) {
            return { key: null, error: "Cubist config not found for this tenant" };
        }
        const { org } = await (0, CubeSignerClient_1.getCsClient)(tenantId);
        if (org != null) {
            const keys = (await org.keys()).length;
            const users = (await org.users()).length;
            console.log("total org user", users, "total org keys", keys);
            return { data: { users, wallets: keys }, error: null };
        }
        else {
            return { data: null, error: "Error in getting org data" };
        }
    }
    catch (err) {
        console.error(err);
        return { key: null, error: "Erorr in creating cubist client for gas payer" };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3ViaXN0RnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3ViaXN0RnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsNENBY0M7QUFPRCw0Q0FxQkM7QUE3Q0QsbURBQWtGO0FBQ2xGLHlEQUErRjtBQUV4RixLQUFLLFVBQVUsZ0JBQWdCLENBQUMsZUFBc0IsRUFBRSxNQUFXO0lBQ3hFLElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxzQ0FBbUIsRUFBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3JFLElBQUssTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUUvQixPQUFPLE1BQU0sQ0FBQztRQUNWLENBQUM7UUFFRCxPQUFPLElBQUksQ0FBQztJQUVkLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7QUFDSCxDQUFDO0FBR0Q7OztHQUdHO0FBQ0ksS0FBSyxVQUFVLGdCQUFnQixDQUFFLFFBQWdCO0lBQ3RELElBQUksQ0FBQztRQUNILE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBZSxFQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3JELElBQUksWUFBWSxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3pCLE9BQU8sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSx5Q0FBeUMsRUFBRSxDQUFDO1FBQ3pFLENBQUM7UUFDRCxNQUFNLEVBQUMsR0FBRyxFQUFDLEdBQUcsTUFBTSxJQUFBLDhCQUFXLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDMUMsSUFBRyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7WUFDakIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUV4QyxNQUFNLEtBQUssR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQ3pDLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUMsS0FBSyxFQUFDLGdCQUFnQixFQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pELE9BQU8sRUFBRyxJQUFJLEVBQUMsRUFBQyxLQUFLLEVBQUMsT0FBTyxFQUFDLElBQUksRUFBQyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUNsRCxDQUFDO2FBQ0csQ0FBQztZQUNILE9BQU8sRUFBRyxJQUFJLEVBQUMsSUFBSSxFQUFDLEtBQUssRUFBRSwyQkFBMkIsRUFBRSxDQUFDO1FBQzNELENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsT0FBTyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLCtDQUErQyxFQUFFLENBQUM7SUFDL0UsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkZWxldGVDdXN0b21lciwgZGVsZXRlV2FsbGV0LCBnZXRDdWJpc3RDb25maWcgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7IGRlbGV0ZUN1YmlzdFVzZXJLZXksIGdldENzQ2xpZW50LCBnZXRDc0NsaWVudEJ5U2VjcmV0TmFtZSB9IGZyb20gXCIuL0N1YmVTaWduZXJDbGllbnRcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlbGV0ZUtleUFuZFVzZXIoY3VzdG9tZXJXYWxsZXRzOiBhbnlbXSwgdGVuYW50OiBhbnkpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdWJpc3QgPSBhd2FpdCBkZWxldGVDdWJpc3RVc2VyS2V5KGN1c3RvbWVyV2FsbGV0cywgdGVuYW50LmlkKTtcbiAgICBpZiAoIGN1YmlzdC51c2VyICE9IG51bGwpIHtcbiAgICAgXG5yZXR1cm4gY3ViaXN0O1xuICAgIH1cblxuICAgIHJldHVybiBudWxsO1xuIFxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5cbi8qKlxuICogVXNlIGEgQ3ViZVNpZ25lciB0b2tlbiBmcm9tIEFXUyBTZWNyZXRzIE1hbmFnZXIgdG8gcmV0cmlldmUgaW5mb3JtYXRpb25cbiAqIGFib3V0IHRoZSBjdXJyZW50IHVzZXJcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1YmlzdE9yZ0RhdGEoIHRlbmFudElkOiBzdHJpbmcsKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgY3ViaXN0Q29uZmlnID0gYXdhaXQgZ2V0Q3ViaXN0Q29uZmlnKHRlbmFudElkKTtcbiAgICBpZiAoY3ViaXN0Q29uZmlnID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7IGtleTogbnVsbCwgZXJyb3I6IFwiQ3ViaXN0IGNvbmZpZyBub3QgZm91bmQgZm9yIHRoaXMgdGVuYW50XCIgfTtcbiAgICB9XG4gICAgY29uc3Qge29yZ30gPSBhd2FpdCBnZXRDc0NsaWVudCh0ZW5hbnRJZCk7XG4gICAgaWYob3JnICE9IG51bGwgKXtcbiAgICBjb25zdCBrZXlzID0gKGF3YWl0IG9yZy5rZXlzKCkpLmxlbmd0aDtcblxuICAgY29uc3QgdXNlcnMgPSAoYXdhaXQgb3JnLnVzZXJzKCkpLmxlbmd0aDtcbiAgIGNvbnNvbGUubG9nKFwidG90YWwgb3JnIHVzZXJcIix1c2VycyxcInRvdGFsIG9yZyBrZXlzXCIsa2V5cyk7XG4gICAgcmV0dXJuIHsgIGRhdGE6e3VzZXJzLHdhbGxldHM6a2V5c30sZXJyb3I6IG51bGwgfTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHJldHVybiB7ICBkYXRhOm51bGwsZXJyb3I6IFwiRXJyb3IgaW4gZ2V0dGluZyBvcmcgZGF0YVwiIH07XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgcmV0dXJuIHsga2V5OiBudWxsLCBlcnJvcjogXCJFcm9yciBpbiBjcmVhdGluZyBjdWJpc3QgY2xpZW50IGZvciBnYXMgcGF5ZXJcIiB9O1xuICB9XG59XG5cbiJdfQ==