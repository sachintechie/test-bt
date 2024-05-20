"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _ReadOnlyAwsSecretsSessionManager_sm, _ReadOnlyAwsSecretsSessionManager_secretId, _ReadOnlyAwsSecretsSessionManager_cache;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCsClient = void 0;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// import { SecretsManager } from 'aws-sdk';
const cs = require("@cubist-labs/cubesigner-sdk");
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const SECRET_NAME = "CubeSignerToken0E1D2960-qP9dUIeYntSs";
/**
 * A session manager that reads a token from AWS Secrets Manager.
 */
class ReadOnlyAwsSecretsSessionManager {
    /**
     * Get the session data. If the session has not expired, this uses cached information.
     * @return {SessionData} The current session data
     */
    async sessionData() {
        if (__classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_cache, "f") !== undefined && !(0, cubesigner_sdk_1.isStale)(__classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_cache, "f"))) {
            return __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_cache, "f");
        }
        console.log("Secrets Manager response", __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_cache, "f"));
        const res = await __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_sm, "f").getSecretValue({ SecretId: __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_secretId, "f") });
        console.log("Secrets Manager response", res);
        const decoded = Buffer.from(res.SecretString, "base64").toString("utf8");
        __classPrivateFieldSet(this, _ReadOnlyAwsSecretsSessionManager_cache, JSON.parse(decoded), "f");
        return __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_cache, "f");
    }
    /** @inheritdoc */
    async metadata() {
        const data = await this.sessionData();
        if ((0, cubesigner_sdk_1.isStale)(data)) {
            throw new Error("Session is stale");
        }
        return (0, cubesigner_sdk_1.metadata)(data);
    }
    /** @inheritdoc */
    async token() {
        const data = await this.sessionData();
        return data.token;
    }
    /**
     * Constructor.
     * @param {string} secretId The name of the secret holding the token
     */
    constructor(secretId) {
        /** Client for AWS Secrets Manager */
        _ReadOnlyAwsSecretsSessionManager_sm.set(this, void 0);
        /** ID of the secret */
        _ReadOnlyAwsSecretsSessionManager_secretId.set(this, void 0);
        /** The latest session data retrieved from AWS Secrets Manager */
        _ReadOnlyAwsSecretsSessionManager_cache.set(this, void 0);
        __classPrivateFieldSet(this, _ReadOnlyAwsSecretsSessionManager_sm, new client_secrets_manager_1.SecretsManager(), "f");
        __classPrivateFieldSet(this, _ReadOnlyAwsSecretsSessionManager_secretId, secretId, "f");
    }
}
_ReadOnlyAwsSecretsSessionManager_sm = new WeakMap(), _ReadOnlyAwsSecretsSessionManager_secretId = new WeakMap(), _ReadOnlyAwsSecretsSessionManager_cache = new WeakMap();
/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
async function getCsClient() {
    try {
        console.log("Creating client");
        const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(SECRET_NAME));
        console.log("Client created", client);
        const org = client.org();
        return { client, org };
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.getCsClient = getCsClient;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3ViZVNpZ25lckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkN1YmVTaWduZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsNEVBQWlFO0FBQ2pFLDRDQUE0QztBQUU1QyxrREFBa0Q7QUFDbEQsZ0VBTXFDO0FBR3BDLE1BQU0sV0FBVyxHQUFXLHNDQUFzQyxDQUFDO0FBRXBFOztHQUVHO0FBQ0gsTUFBTSxnQ0FBZ0M7SUFRcEM7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFdBQVc7UUFFZixJQUFJLHVCQUFBLElBQUksK0NBQU8sS0FBSyxTQUFTLElBQUksQ0FBQyxJQUFBLHdCQUFPLEVBQUMsdUJBQUEsSUFBSSwrQ0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN2RCxPQUFPLHVCQUFBLElBQUksK0NBQU8sQ0FBQztRQUNyQixDQUFDO1FBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsRUFBQyx1QkFBQSxJQUFJLCtDQUFPLENBQUMsQ0FBQztRQUVwRCxNQUFNLEdBQUcsR0FBRyxNQUFNLHVCQUFBLElBQUksNENBQUksQ0FBQyxjQUFjLENBQUMsRUFBRSxRQUFRLEVBQUUsdUJBQUEsSUFBSSxrREFBVSxFQUFFLENBQUMsQ0FBQztRQUN4RSxPQUFPLENBQUMsR0FBRyxDQUFDLDBCQUEwQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzVDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUUsdUJBQUEsSUFBSSwyQ0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBZ0IsTUFBQSxDQUFDO1FBQ2pELE9BQU8sdUJBQUEsSUFBSSwrQ0FBTyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN0QyxJQUFJLElBQUEsd0JBQU8sRUFBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1lBQ2xCLE1BQU0sSUFBSSxLQUFLLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBQ0QsT0FBTyxJQUFBLHlCQUFRLEVBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELGtCQUFrQjtJQUNsQixLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBQ3RDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsWUFBWSxRQUFnQjtRQTVDNUIscUNBQXFDO1FBQ3JDLHVEQUFvQjtRQUNwQix1QkFBdUI7UUFDdkIsNkRBQWtCO1FBQ2xCLGlFQUFpRTtRQUNqRSwwREFBcUI7UUF3Q25CLHVCQUFBLElBQUksd0NBQU8sSUFBSSx1Q0FBYyxFQUFFLE1BQUEsQ0FBQztRQUNoQyx1QkFBQSxJQUFJLDhDQUFhLFFBQVEsTUFBQSxDQUFDO0lBQzVCLENBQUM7Q0FDRjs7QUFFRDs7O0dBR0c7QUFDSSxLQUFLLFVBQVUsV0FBVztJQUMvQixJQUFHLENBQUM7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDakMsTUFBTSxNQUFNLEdBQUcsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUM3QyxJQUFJLGdDQUFnQyxDQUFDLFdBQVcsQ0FBQyxDQUNsRCxDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBQyxNQUFNLENBQUMsQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDekIsT0FBTyxFQUFDLE1BQU0sRUFBQyxHQUFHLEVBQUMsQ0FBQztJQUN0QixDQUFDO0lBQ0QsT0FBTSxHQUFHLEVBQUMsQ0FBQztRQUNULE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsTUFBTSxHQUFHLENBQUM7SUFDWixDQUFDO0FBQ0QsQ0FBQztBQWRELGtDQWNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VjcmV0c01hbmFnZXIgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlclwiO1xyXG4vLyBpbXBvcnQgeyBTZWNyZXRzTWFuYWdlciB9IGZyb20gJ2F3cy1zZGsnO1xyXG5cclxuaW1wb3J0ICogYXMgY3MgZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xyXG5pbXBvcnQge1xyXG4gIGlzU3RhbGUsXHJcbiAgbWV0YWRhdGEsXHJcbiAgdHlwZSBTZXNzaW9uRGF0YSxcclxuICB0eXBlIFNlc3Npb25NYW5hZ2VyLFxyXG4gIHR5cGUgU2Vzc2lvbk1ldGFkYXRhLFxyXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcclxuXHJcblxyXG4gY29uc3QgU0VDUkVUX05BTUU6IHN0cmluZyA9IFwiQ3ViZVNpZ25lclRva2VuMEUxRDI5NjAtcVA5ZFVJZVludFNzXCI7XHJcblxyXG4vKipcclxuICogQSBzZXNzaW9uIG1hbmFnZXIgdGhhdCByZWFkcyBhIHRva2VuIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlci5cclxuICovXHJcbmNsYXNzIFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xyXG4gIC8qKiBDbGllbnQgZm9yIEFXUyBTZWNyZXRzIE1hbmFnZXIgKi9cclxuICAjc206IFNlY3JldHNNYW5hZ2VyO1xyXG4gIC8qKiBJRCBvZiB0aGUgc2VjcmV0ICovXHJcbiAgI3NlY3JldElkOiBzdHJpbmc7XHJcbiAgLyoqIFRoZSBsYXRlc3Qgc2Vzc2lvbiBkYXRhIHJldHJpZXZlZCBmcm9tIEFXUyBTZWNyZXRzIE1hbmFnZXIgKi9cclxuICAjY2FjaGU/OiBTZXNzaW9uRGF0YTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0IHRoZSBzZXNzaW9uIGRhdGEuIElmIHRoZSBzZXNzaW9uIGhhcyBub3QgZXhwaXJlZCwgdGhpcyB1c2VzIGNhY2hlZCBpbmZvcm1hdGlvbi5cclxuICAgKiBAcmV0dXJuIHtTZXNzaW9uRGF0YX0gVGhlIGN1cnJlbnQgc2Vzc2lvbiBkYXRhXHJcbiAgICovXHJcbiAgYXN5bmMgc2Vzc2lvbkRhdGEoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xyXG5cclxuICAgIGlmICh0aGlzLiNjYWNoZSAhPT0gdW5kZWZpbmVkICYmICFpc1N0YWxlKHRoaXMuI2NhY2hlKSkge1xyXG4gICAgICByZXR1cm4gdGhpcy4jY2FjaGU7XHJcbiAgICB9XHJcbiAgICBjb25zb2xlLmxvZyhcIlNlY3JldHMgTWFuYWdlciByZXNwb25zZVwiLHRoaXMuI2NhY2hlKTtcclxuXHJcbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzbS5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiB0aGlzLiNzZWNyZXRJZCB9KTtcclxuICAgIGNvbnNvbGUubG9nKFwiU2VjcmV0cyBNYW5hZ2VyIHJlc3BvbnNlXCIscmVzKTtcclxuICAgIGNvbnN0IGRlY29kZWQgPSBCdWZmZXIuZnJvbShyZXMuU2VjcmV0U3RyaW5nISwgXCJiYXNlNjRcIikudG9TdHJpbmcoXCJ1dGY4XCIpO1xyXG4gICAgdGhpcy4jY2FjaGUgPSBKU09OLnBhcnNlKGRlY29kZWQpIGFzIFNlc3Npb25EYXRhO1xyXG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlO1xyXG4gIH1cclxuXHJcbiAgLyoqIEBpbmhlcml0ZG9jICovXHJcbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnNlc3Npb25EYXRhKCk7XHJcbiAgICBpZiAoaXNTdGFsZShkYXRhKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTZXNzaW9uIGlzIHN0YWxlXCIpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIG1ldGFkYXRhKGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgLyoqIEBpbmhlcml0ZG9jICovXHJcbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLnNlc3Npb25EYXRhKCk7XHJcbiAgICByZXR1cm4gZGF0YS50b2tlbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbnN0cnVjdG9yLlxyXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzZWNyZXRJZCBUaGUgbmFtZSBvZiB0aGUgc2VjcmV0IGhvbGRpbmcgdGhlIHRva2VuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3Ioc2VjcmV0SWQ6IHN0cmluZykge1xyXG4gICAgdGhpcy4jc20gPSBuZXcgU2VjcmV0c01hbmFnZXIoKTtcclxuICAgIHRoaXMuI3NlY3JldElkID0gc2VjcmV0SWQ7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogVXNlIGEgQ3ViZVNpZ25lciB0b2tlbiBmcm9tIEFXUyBTZWNyZXRzIE1hbmFnZXIgdG8gcmV0cmlldmUgaW5mb3JtYXRpb25cclxuICogYWJvdXQgdGhlIGN1cnJlbnQgdXNlclxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldENzQ2xpZW50KCkge1xyXG4gIHRyeXtcclxuICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgY2xpZW50XCIpO1xyXG4gIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNzLkN1YmVTaWduZXJDbGllbnQuY3JlYXRlKFxyXG4gICAgbmV3IFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyKFNFQ1JFVF9OQU1FKSxcclxuICApO1xyXG4gIGNvbnNvbGUubG9nKFwiQ2xpZW50IGNyZWF0ZWRcIixjbGllbnQpO1xyXG4gIGNvbnN0IG9yZyA9IGNsaWVudC5vcmcoKTtcclxuICByZXR1cm4ge2NsaWVudCxvcmd9O1xyXG59XHJcbmNhdGNoKGVycil7XHJcbiAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gIHRocm93IGVycjtcclxufVxyXG59XHJcblxyXG5cclxuXHJcbiJdfQ==