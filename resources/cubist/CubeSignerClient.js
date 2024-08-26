"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getCsClient = getCsClient;
exports.getCsClientBySecretName = getCsClientBySecretName;
exports.getPayerCsSignerKey = getPayerCsSignerKey;
exports.deleteCubistUserKey = deleteCubistUserKey;
exports.deleteMasterCubistUser = deleteMasterCubistUser;
exports.oidcLogin = oidcLogin;
exports.getKey = getKey;
exports.signTransaction = signTransaction;
exports.getCubistKey = getCubistKey;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
const cs = __importStar(require("@cubist-labs/cubesigner-sdk"));
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const dbFunctions_1 = require("../db/dbFunctions");
const web3_js_1 = require("@solana/web3.js");
// const SECRET_NAME: string = "SchoolHackCubeSignerToken";
// const PAYER_SECRET_NAME: string = "SchoolHackGasPayerCubistToken";
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
        const res = await __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_sm, "f").getSecretValue({ SecretId: __classPrivateFieldGet(this, _ReadOnlyAwsSecretsSessionManager_secretId, "f") });
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
async function getCsClient(teantid) {
    try {
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(teantid);
        if (cubistConfig !== null) {
            const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig?.signersecretname));
            const org = client.org();
            const orgId = cubistConfig?.orgid;
            return { client, org, orgId };
        }
        else {
            return { client: null, org: null, orgId: null };
        }
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
async function getCsClientBySecretName(tenantId, secretName) {
    try {
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenantId);
        const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(secretName));
        const org = client.org();
        const orgId = cubistConfig?.orgid;
        return { client, org, orgId };
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
async function getPayerCsSignerKey(chainType, tenantId) {
    try {
        console.log("Creating client");
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenantId);
        if (cubistConfig == null) {
            return { key: null, error: "Cubist config not found for this tenant" };
        }
        const payerWallet = await (0, dbFunctions_1.getPayerWallet)(chainType, tenantId);
        if (payerWallet == null) {
            return { key: null, error: "Payer wallet not found" };
        }
        const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig.gaspayersecretname));
        console.log("Client created", client);
        const keys = await client.sessionKeys();
        const key = keys.filter((key) => key.materialId === payerWallet.walletaddress);
        return { key: key[0], error: null };
    }
    catch (err) {
        console.error(err);
        return { key: null, error: "Erorr in creating cubist client for gas payer" };
    }
}
/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
async function deleteCubistUserKey(customerWallets, tenantId) {
    try {
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenantId);
        if (cubistConfig == null) {
            return { key: null, error: "Cubist config not found for this tenant" };
        }
        const { org } = await getCsClientBySecretName(tenantId, "SchoolHackDeleteUserAndKey");
        const keys = await org.keys();
        const users = await org.users();
        console.log("total org user", users.length, "total org keys", keys.length);
        // const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig.gaspayersecretname));
        // console.log("Client created", client);
        // const keys = await client.sessionKeys();
        let deletedUsers = [];
        for (const customer of customerWallets) {
            const key = keys.filter((key) => key.materialId === customer.walletaddress);
            const user = users.filter((user) => user.id === customer.cubistuserid);
            // const key = await cs.CubeSignerKey.get(cubistUserId);
            const deletedKey = await key[0].delete();
            const deletedUser = await org.deleteUser(user[0].id);
            const customerId = await (0, dbFunctions_1.deleteCustomer)(customer.customerid, tenantId);
            const walletId = await (0, dbFunctions_1.deleteWallet)(customer.customerid, customer.walletaddress);
            deletedUsers.push({ customerId, walletId, deletedUser });
            console.log("Deleted user", user);
        }
        return { user: deletedUsers, error: null };
    }
    catch (err) {
        console.error(err);
        return { key: null, error: "Erorr in creating cubist client for gas payer" };
    }
}
/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
async function deleteMasterCubistUser(customerWallets, tenantId) {
    try {
        const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenantId);
        if (cubistConfig == null) {
            return { key: null, error: "Cubist config not found for this tenant" };
        }
        const { org } = await getCsClientBySecretName(tenantId, "SchoolHackDeleteUser-PROD");
        const users = await org.users();
        console.log("total org user", users.length);
        // const client = await cs.CubeSignerClient.create(new ReadOnlyAwsSecretsSessionManager(cubistConfig.gaspayersecretname));
        // console.log("Client created", client);
        // const keys = await client.sessionKeys();
        let deletedUsers = [];
        for (const customer of customerWallets) {
            const user = users.filter((user) => user.id === customer);
            // const key = await cs.CubeSignerKey.get(cubistUserId);
            const deletedUser = await org.deleteUser(customer);
            deletedUsers.push({ deletedUser });
            console.log("Deleted user", user);
        }
        return { user: deletedUsers, error: null };
    }
    catch (err) {
        console.error(err);
        return { key: null, error: "Erorr in creating cubist client for gas payer" };
    }
}
/**
 * Get the CubeSigner key from an OIDC token
 * @param env
 * @param orgId
 * @param oidcToken
 * @param scopes
 */
async function oidcLogin(env, orgId, oidcToken, scopes) {
    try {
        console.log("Logging in with OIDC");
        const resp = await cs.CubeSignerClient.createOidcSession(env, orgId, oidcToken, scopes);
        const csClient = await cs.CubeSignerClient.create(resp.data());
        return csClient;
    }
    catch (err) {
        console.error(err);
        return null;
    }
}
async function getKey(oidcClient, chainType, cubistUserid) {
    try {
        console.log("Getting key", cubistUserid);
        const keys = await oidcClient.sessionKeys();
        const key = keys.filter((key) => key.cached.owner == cubistUserid && key.cached.key_type == cs.Ed25519.Solana);
        console.log("Key", keys.length, key.length, key[0]);
        return key[0];
    }
    catch (err) {
        console.error(err);
        return null;
    }
}
async function signTransaction(transaction, key) {
    const base64Payer = transaction.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respPayer = await key.signSolana({ message_base64: base64Payer });
    const sigPayer = respPayer.data().signature;
    const sigBytesPayer = Buffer.from(sigPayer.slice(2), "hex");
    transaction.addSignature(new web3_js_1.PublicKey(key.materialId), sigBytesPayer);
}
async function getCubistKey(env, cubistOrgId, oidcToken, scopes, walletAddress) {
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, scopes);
    if (!oidcClient) {
        throw new Error("Please send a valid identity token for verification");
    }
    const keys = await oidcClient.sessionKeys();
    if (keys.length === 0) {
        throw new Error("Given identity token is not the owner of given wallet address");
    }
    const senderKey = keys.filter((key) => key.materialId === walletAddress);
    if (senderKey.length === 0) {
        throw new Error("Given identity token is not the owner of given wallet address");
    }
    return senderKey[0];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ3ViZVNpZ25lckNsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkN1YmVTaWduZXJDbGllbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWdFQSxrQ0FnQkM7QUFNRCwwREFXQztBQVFELGtEQW9CQztBQU1ELGtEQWtDQztBQU9ELHdEQTZCQztBQVNELDhCQVdDO0FBRUQsd0JBV0M7QUFFRCwwQ0FPQztBQUVELG9DQWNDO0FBblFELDRFQUFpRTtBQUVqRSxnRUFBa0Q7QUFDbEQsZ0VBQTZIO0FBQzdILG1EQUFrRztBQUNsRyw2Q0FBeUQ7QUFFekQsMkRBQTJEO0FBQzNELHFFQUFxRTtBQUVyRTs7R0FFRztBQUNILE1BQU0sZ0NBQWdDO0lBUXBDOzs7T0FHRztJQUNILEtBQUssQ0FBQyxXQUFXO1FBQ2YsSUFBSSx1QkFBQSxJQUFJLCtDQUFPLEtBQUssU0FBUyxJQUFJLENBQUMsSUFBQSx3QkFBTyxFQUFDLHVCQUFBLElBQUksK0NBQU8sQ0FBQyxFQUFFLENBQUM7WUFDdkQsT0FBTyx1QkFBQSxJQUFJLCtDQUFPLENBQUM7UUFDckIsQ0FBQztRQUNELE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSw0Q0FBSSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsRUFBRSx1QkFBQSxJQUFJLGtEQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUUsdUJBQUEsSUFBSSwyQ0FBVSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBZ0IsTUFBQSxDQUFDO1FBQ2pELE9BQU8sdUJBQUEsSUFBSSwrQ0FBTyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxrQkFBa0I7SUFDbEIsS0FBSyxDQUFDLFFBQVE7UUFDWixN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S0FBSyxhQUFhLENBQUMsQ0FBQztJQUNqRixJQUFJLFNBQVMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQywrREFBK0QsQ0FBQyxDQUFDO0lBQ25GLENBQUM7SUFDRCxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtBQUNyQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VjcmV0c01hbmFnZXIgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXNlY3JldHMtbWFuYWdlclwiO1xuXG5pbXBvcnQgKiBhcyBjcyBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBpc1N0YWxlLCBtZXRhZGF0YSwgdHlwZSBTZXNzaW9uRGF0YSwgdHlwZSBTZXNzaW9uTWFuYWdlciwgdHlwZSBTZXNzaW9uTWV0YWRhdGEgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBkZWxldGVDdXN0b21lciwgZGVsZXRlV2FsbGV0LCBnZXRDdWJpc3RDb25maWcsIGdldFBheWVyV2FsbGV0IH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5pbXBvcnQgeyBQdWJsaWNLZXksIFRyYW5zYWN0aW9uIH0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuXG4vLyBjb25zdCBTRUNSRVRfTkFNRTogc3RyaW5nID0gXCJTY2hvb2xIYWNrQ3ViZVNpZ25lclRva2VuXCI7XG4vLyBjb25zdCBQQVlFUl9TRUNSRVRfTkFNRTogc3RyaW5nID0gXCJTY2hvb2xIYWNrR2FzUGF5ZXJDdWJpc3RUb2tlblwiO1xuXG4vKipcbiAqIEEgc2Vzc2lvbiBtYW5hZ2VyIHRoYXQgcmVhZHMgYSB0b2tlbiBmcm9tIEFXUyBTZWNyZXRzIE1hbmFnZXIuXG4gKi9cbmNsYXNzIFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXIge1xuICAvKiogQ2xpZW50IGZvciBBV1MgU2VjcmV0cyBNYW5hZ2VyICovXG4gICNzbTogU2VjcmV0c01hbmFnZXI7XG4gIC8qKiBJRCBvZiB0aGUgc2VjcmV0ICovXG4gICNzZWNyZXRJZDogc3RyaW5nO1xuICAvKiogVGhlIGxhdGVzdCBzZXNzaW9uIGRhdGEgcmV0cmlldmVkIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciAqL1xuICAjY2FjaGU/OiBTZXNzaW9uRGF0YTtcblxuICAvKipcbiAgICogR2V0IHRoZSBzZXNzaW9uIGRhdGEuIElmIHRoZSBzZXNzaW9uIGhhcyBub3QgZXhwaXJlZCwgdGhpcyB1c2VzIGNhY2hlZCBpbmZvcm1hdGlvbi5cbiAgICogQHJldHVybiB7U2Vzc2lvbkRhdGF9IFRoZSBjdXJyZW50IHNlc3Npb24gZGF0YVxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkRhdGEoKTogUHJvbWlzZTxTZXNzaW9uRGF0YT4ge1xuICAgIGlmICh0aGlzLiNjYWNoZSAhPT0gdW5kZWZpbmVkICYmICFpc1N0YWxlKHRoaXMuI2NhY2hlKSkge1xuICAgICAgcmV0dXJuIHRoaXMuI2NhY2hlO1xuICAgIH1cbiAgICBjb25zdCByZXMgPSBhd2FpdCB0aGlzLiNzbS5nZXRTZWNyZXRWYWx1ZSh7IFNlY3JldElkOiB0aGlzLiNzZWNyZXRJZCB9KTtcbiAgICBjb25zdCBkZWNvZGVkID0gQnVmZmVyLmZyb20ocmVzLlNlY3JldFN0cmluZyEsIFwiYmFzZTY0XCIpLnRvU3RyaW5nKFwidXRmOFwiKTtcbiAgICB0aGlzLiNjYWNoZSA9IEpTT04ucGFyc2UoZGVjb2RlZCkgYXMgU2Vzc2lvbkRhdGE7XG4gICAgcmV0dXJuIHRoaXMuI2NhY2hlO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuc2Vzc2lvbkRhdGEoKTtcbiAgICBpZiAoaXNTdGFsZShkYXRhKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU2Vzc2lvbiBpcyBzdGFsZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIG1ldGFkYXRhKGRhdGEpO1xuICB9XG5cbiAgLyoqIEBpbmhlcml0ZG9jICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuc2Vzc2lvbkRhdGEoKTtcbiAgICByZXR1cm4gZGF0YS50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICogQHBhcmFtIHtzdHJpbmd9IHNlY3JldElkIFRoZSBuYW1lIG9mIHRoZSBzZWNyZXQgaG9sZGluZyB0aGUgdG9rZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yKHNlY3JldElkOiBzdHJpbmcpIHtcbiAgICB0aGlzLiNzbSA9IG5ldyBTZWNyZXRzTWFuYWdlcigpO1xuICAgIHRoaXMuI3NlY3JldElkID0gc2VjcmV0SWQ7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgYSBDdWJlU2lnbmVyIHRva2VuIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciB0byByZXRyaWV2ZSBpbmZvcm1hdGlvblxuICogYWJvdXQgdGhlIGN1cnJlbnQgdXNlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q3NDbGllbnQodGVhbnRpZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgY3ViaXN0Q29uZmlnID0gYXdhaXQgZ2V0Q3ViaXN0Q29uZmlnKHRlYW50aWQpO1xuICAgIGlmKGN1YmlzdENvbmZpZyAhPT0gbnVsbCl7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgY3MuQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUobmV3IFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyKGN1YmlzdENvbmZpZz8uc2lnbmVyc2VjcmV0bmFtZSEpKTtcbiAgICBjb25zdCBvcmcgPSBjbGllbnQub3JnKCk7XG4gICAgY29uc3Qgb3JnSWQgPSBjdWJpc3RDb25maWc/Lm9yZ2lkO1xuICAgIHJldHVybiB7IGNsaWVudCwgb3JnLCBvcmdJZCB9O1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgcmV0dXJuIHsgY2xpZW50OiBudWxsLCBvcmc6IG51bGwsIG9yZ0lkOiBudWxsfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2UgYSBDdWJlU2lnbmVyIHRva2VuIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciB0byByZXRyaWV2ZSBpbmZvcm1hdGlvblxuICogYWJvdXQgdGhlIGN1cnJlbnQgdXNlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q3NDbGllbnRCeVNlY3JldE5hbWUodGVuYW50SWQ6IHN0cmluZyxzZWNyZXROYW1lOnN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IGN1YmlzdENvbmZpZyA9IGF3YWl0IGdldEN1YmlzdENvbmZpZyh0ZW5hbnRJZCk7XG4gICAgY29uc3QgY2xpZW50ID0gYXdhaXQgY3MuQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUobmV3IFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyKHNlY3JldE5hbWUpKTtcbiAgICBjb25zdCBvcmcgPSBjbGllbnQub3JnKCk7XG4gICAgY29uc3Qgb3JnSWQgPSBjdWJpc3RDb25maWc/Lm9yZ2lkO1xuICAgIHJldHVybiB7IGNsaWVudCwgb3JnLCBvcmdJZCB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5cblxuLyoqXG4gKiBVc2UgYSBDdWJlU2lnbmVyIHRva2VuIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciB0byByZXRyaWV2ZSBpbmZvcm1hdGlvblxuICogYWJvdXQgdGhlIGN1cnJlbnQgdXNlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0UGF5ZXJDc1NpZ25lcktleShjaGFpblR5cGU6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgY2xpZW50XCIpO1xuICAgIGNvbnN0IGN1YmlzdENvbmZpZyA9IGF3YWl0IGdldEN1YmlzdENvbmZpZyh0ZW5hbnRJZCk7XG4gICAgaWYgKGN1YmlzdENvbmZpZyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4geyBrZXk6IG51bGwsIGVycm9yOiBcIkN1YmlzdCBjb25maWcgbm90IGZvdW5kIGZvciB0aGlzIHRlbmFudFwiIH07XG4gICAgfVxuICAgIGNvbnN0IHBheWVyV2FsbGV0ID0gYXdhaXQgZ2V0UGF5ZXJXYWxsZXQoY2hhaW5UeXBlLCB0ZW5hbnRJZCk7XG4gICAgaWYgKHBheWVyV2FsbGV0ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB7IGtleTogbnVsbCwgZXJyb3I6IFwiUGF5ZXIgd2FsbGV0IG5vdCBmb3VuZFwiIH07XG4gICAgfVxuICAgIGNvbnN0IGNsaWVudCA9IGF3YWl0IGNzLkN1YmVTaWduZXJDbGllbnQuY3JlYXRlKG5ldyBSZWFkT25seUF3c1NlY3JldHNTZXNzaW9uTWFuYWdlcihjdWJpc3RDb25maWcuZ2FzcGF5ZXJzZWNyZXRuYW1lKSk7XG4gICAgY29uc29sZS5sb2coXCJDbGllbnQgY3JlYXRlZFwiLCBjbGllbnQpO1xuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBjbGllbnQuc2Vzc2lvbktleXMoKTtcbiAgICBjb25zdCBrZXkgPSBrZXlzLmZpbHRlcigoa2V5OiBjcy5LZXkpID0+IGtleS5tYXRlcmlhbElkID09PSBwYXllcldhbGxldC53YWxsZXRhZGRyZXNzKTtcbiAgICByZXR1cm4geyBrZXk6IGtleVswXSwgZXJyb3I6IG51bGwgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHJldHVybiB7IGtleTogbnVsbCwgZXJyb3I6IFwiRXJvcnIgaW4gY3JlYXRpbmcgY3ViaXN0IGNsaWVudCBmb3IgZ2FzIHBheWVyXCIgfTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZSBhIEN1YmVTaWduZXIgdG9rZW4gZnJvbSBBV1MgU2VjcmV0cyBNYW5hZ2VyIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uXG4gKiBhYm91dCB0aGUgY3VycmVudCB1c2VyXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVDdWJpc3RVc2VyS2V5KCBjdXN0b21lcldhbGxldHM6YW55W10sdGVuYW50SWQ6IHN0cmluZywpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50SWQpO1xuICAgIGlmIChjdWJpc3RDb25maWcgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHsga2V5OiBudWxsLCBlcnJvcjogXCJDdWJpc3QgY29uZmlnIG5vdCBmb3VuZCBmb3IgdGhpcyB0ZW5hbnRcIiB9O1xuICAgIH1cbiAgICBjb25zdCB7b3JnfSA9IGF3YWl0IGdldENzQ2xpZW50QnlTZWNyZXROYW1lKHRlbmFudElkLFwiU2Nob29sSGFja0RlbGV0ZVVzZXJBbmRLZXlcIik7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IG9yZy5rZXlzKCk7XG5cbiAgIGNvbnN0IHVzZXJzID0gYXdhaXQgb3JnLnVzZXJzKCk7XG4gICBjb25zb2xlLmxvZyhcInRvdGFsIG9yZyB1c2VyXCIsdXNlcnMubGVuZ3RoLFwidG90YWwgb3JnIGtleXNcIixrZXlzLmxlbmd0aCk7XG5cbiAgICAvLyBjb25zdCBjbGllbnQgPSBhd2FpdCBjcy5DdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZShuZXcgUmVhZE9ubHlBd3NTZWNyZXRzU2Vzc2lvbk1hbmFnZXIoY3ViaXN0Q29uZmlnLmdhc3BheWVyc2VjcmV0bmFtZSkpO1xuICAgLy8gY29uc29sZS5sb2coXCJDbGllbnQgY3JlYXRlZFwiLCBjbGllbnQpO1xuICAgLy8gY29uc3Qga2V5cyA9IGF3YWl0IGNsaWVudC5zZXNzaW9uS2V5cygpO1xuICAgbGV0IGRlbGV0ZWRVc2VycyA9IFtdO1xuICAgZm9yIChjb25zdCBjdXN0b21lciBvZiBjdXN0b21lcldhbGxldHMpIHtcbiAgICBjb25zdCBrZXkgPSBrZXlzLmZpbHRlcigoa2V5OiBjcy5LZXkpID0+IGtleS5tYXRlcmlhbElkID09PSBjdXN0b21lci53YWxsZXRhZGRyZXNzKTtcbiAgICBjb25zdCB1c2VyID0gIHVzZXJzLmZpbHRlcigodXNlciApPT4gdXNlci5pZCA9PT0gY3VzdG9tZXIuY3ViaXN0dXNlcmlkKTtcbiAgICAvLyBjb25zdCBrZXkgPSBhd2FpdCBjcy5DdWJlU2lnbmVyS2V5LmdldChjdWJpc3RVc2VySWQpO1xuICAgIGNvbnN0IGRlbGV0ZWRLZXkgPSBhd2FpdCBrZXlbMF0uZGVsZXRlKCk7XG4gICAgY29uc3QgZGVsZXRlZFVzZXIgPSBhd2FpdCBvcmcuZGVsZXRlVXNlcih1c2VyWzBdLmlkKTtcbiAgICBjb25zdCBjdXN0b21lcklkID0gYXdhaXQgZGVsZXRlQ3VzdG9tZXIoY3VzdG9tZXIuY3VzdG9tZXJpZCx0ZW5hbnRJZCk7XG4gICAgY29uc3Qgd2FsbGV0SWQgPSBhd2FpdCBkZWxldGVXYWxsZXQoY3VzdG9tZXIuY3VzdG9tZXJpZCxjdXN0b21lci53YWxsZXRhZGRyZXNzKTtcbiAgICBkZWxldGVkVXNlcnMucHVzaCh7Y3VzdG9tZXJJZCx3YWxsZXRJZCxkZWxldGVkVXNlcn0pO1xuICAgIGNvbnNvbGUubG9nKFwiRGVsZXRlZCB1c2VyXCIsIHVzZXIpO1xuICAgfVxuICAgXG5cbiAgICByZXR1cm4geyAgdXNlciA6IGRlbGV0ZWRVc2VycyxlcnJvcjogbnVsbCB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgcmV0dXJuIHsga2V5OiBudWxsLCBlcnJvcjogXCJFcm9yciBpbiBjcmVhdGluZyBjdWJpc3QgY2xpZW50IGZvciBnYXMgcGF5ZXJcIiB9O1xuICB9XG59XG5cblxuLyoqXG4gKiBVc2UgYSBDdWJlU2lnbmVyIHRva2VuIGZyb20gQVdTIFNlY3JldHMgTWFuYWdlciB0byByZXRyaWV2ZSBpbmZvcm1hdGlvblxuICogYWJvdXQgdGhlIGN1cnJlbnQgdXNlclxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlTWFzdGVyQ3ViaXN0VXNlciggY3VzdG9tZXJXYWxsZXRzOmFueVtdLHRlbmFudElkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50SWQpO1xuICAgIGlmIChjdWJpc3RDb25maWcgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHsga2V5OiBudWxsLCBlcnJvcjogXCJDdWJpc3QgY29uZmlnIG5vdCBmb3VuZCBmb3IgdGhpcyB0ZW5hbnRcIiB9O1xuICAgIH1cbiAgICBjb25zdCB7b3JnfSA9IGF3YWl0IGdldENzQ2xpZW50QnlTZWNyZXROYW1lKHRlbmFudElkLFwiU2Nob29sSGFja0RlbGV0ZVVzZXItUFJPRFwiKTtcblxuICAgY29uc3QgdXNlcnMgPSBhd2FpdCBvcmcudXNlcnMoKTtcbiAgIGNvbnNvbGUubG9nKFwidG90YWwgb3JnIHVzZXJcIix1c2Vycy5sZW5ndGgpO1xuXG4gICAgLy8gY29uc3QgY2xpZW50ID0gYXdhaXQgY3MuQ3ViZVNpZ25lckNsaWVudC5jcmVhdGUobmV3IFJlYWRPbmx5QXdzU2VjcmV0c1Nlc3Npb25NYW5hZ2VyKGN1YmlzdENvbmZpZy5nYXNwYXllcnNlY3JldG5hbWUpKTtcbiAgIC8vIGNvbnNvbGUubG9nKFwiQ2xpZW50IGNyZWF0ZWRcIiwgY2xpZW50KTtcbiAgIC8vIGNvbnN0IGtleXMgPSBhd2FpdCBjbGllbnQuc2Vzc2lvbktleXMoKTtcbiAgIGxldCBkZWxldGVkVXNlcnMgPSBbXTtcbiAgIGZvciAoY29uc3QgY3VzdG9tZXIgb2YgY3VzdG9tZXJXYWxsZXRzKSB7XG4gICAgY29uc3QgdXNlciA9ICB1c2Vycy5maWx0ZXIoKHVzZXIgKT0+IHVzZXIuaWQgPT09IGN1c3RvbWVyKTtcbiAgICAvLyBjb25zdCBrZXkgPSBhd2FpdCBjcy5DdWJlU2lnbmVyS2V5LmdldChjdWJpc3RVc2VySWQpO1xuICAgIGNvbnN0IGRlbGV0ZWRVc2VyID0gYXdhaXQgb3JnLmRlbGV0ZVVzZXIoY3VzdG9tZXIpO1xuICAgIGRlbGV0ZWRVc2Vycy5wdXNoKHtkZWxldGVkVXNlcn0pO1xuICAgIGNvbnNvbGUubG9nKFwiRGVsZXRlZCB1c2VyXCIsIHVzZXIpO1xuICAgfVxuICAgXG5cbiAgICByZXR1cm4geyAgdXNlciA6IGRlbGV0ZWRVc2VycyxlcnJvcjogbnVsbCB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgcmV0dXJuIHsga2V5OiBudWxsLCBlcnJvcjogXCJFcm9yciBpbiBjcmVhdGluZyBjdWJpc3QgY2xpZW50IGZvciBnYXMgcGF5ZXJcIiB9O1xuICB9XG59XG5cbi8qKlxuICogR2V0IHRoZSBDdWJlU2lnbmVyIGtleSBmcm9tIGFuIE9JREMgdG9rZW5cbiAqIEBwYXJhbSBlbnZcbiAqIEBwYXJhbSBvcmdJZFxuICogQHBhcmFtIG9pZGNUb2tlblxuICogQHBhcmFtIHNjb3Blc1xuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gb2lkY0xvZ2luKGVudjogY3MuRW52SW50ZXJmYWNlLCBvcmdJZDogc3RyaW5nLCBvaWRjVG9rZW46IHN0cmluZywgc2NvcGVzOiBhbnkpIHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcIkxvZ2dpbmcgaW4gd2l0aCBPSURDXCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBjcy5DdWJlU2lnbmVyQ2xpZW50LmNyZWF0ZU9pZGNTZXNzaW9uKGVudiwgb3JnSWQsIG9pZGNUb2tlbiwgc2NvcGVzKTtcbiAgICBjb25zdCBjc0NsaWVudCA9IGF3YWl0IGNzLkN1YmVTaWduZXJDbGllbnQuY3JlYXRlKHJlc3AuZGF0YSgpKTtcblxuICAgIHJldHVybiBjc0NsaWVudDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRLZXkob2lkY0NsaWVudDogYW55LCBjaGFpblR5cGU6IHN0cmluZywgY3ViaXN0VXNlcmlkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcIkdldHRpbmcga2V5XCIsIGN1YmlzdFVzZXJpZCk7XG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbktleXMoKTtcbiAgICBjb25zdCBrZXkgPSBrZXlzLmZpbHRlcigoa2V5OiBjcy5LZXkpID0+IGtleS5jYWNoZWQub3duZXIgPT0gY3ViaXN0VXNlcmlkICYmIGtleS5jYWNoZWQua2V5X3R5cGUgPT0gY3MuRWQyNTUxOS5Tb2xhbmEpO1xuICAgIGNvbnNvbGUubG9nKFwiS2V5XCIsIGtleXMubGVuZ3RoLCBrZXkubGVuZ3RoLCBrZXlbMF0pO1xuICAgIHJldHVybiBrZXlbMF07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uOiBUcmFuc2FjdGlvbiwga2V5OiBjcy5LZXkpIHtcbiAgY29uc3QgYmFzZTY0UGF5ZXIgPSB0cmFuc2FjdGlvbi5zZXJpYWxpemVNZXNzYWdlKCkudG9TdHJpbmcoXCJiYXNlNjRcIik7XG4gIC8vIHNpZ24gdXNpbmcgdGhlIHdlbGwtdHlwZWQgc29sYW5hIGVuZCBwb2ludCAod2hpY2ggcmVxdWlyZXMgYSBiYXNlNjQgc2VyaWFsaXplZCBNZXNzYWdlKVxuICBjb25zdCByZXNwUGF5ZXIgPSBhd2FpdCBrZXkuc2lnblNvbGFuYSh7IG1lc3NhZ2VfYmFzZTY0OiBiYXNlNjRQYXllciB9KTtcbiAgY29uc3Qgc2lnUGF5ZXIgPSByZXNwUGF5ZXIuZGF0YSgpLnNpZ25hdHVyZTtcbiAgY29uc3Qgc2lnQnl0ZXNQYXllciA9IEJ1ZmZlci5mcm9tKHNpZ1BheWVyLnNsaWNlKDIpLCBcImhleFwiKTtcbiAgdHJhbnNhY3Rpb24uYWRkU2lnbmF0dXJlKG5ldyBQdWJsaWNLZXkoa2V5Lm1hdGVyaWFsSWQpLCBzaWdCeXRlc1BheWVyKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1YmlzdEtleShlbnY6IGFueSwgY3ViaXN0T3JnSWQ6IHN0cmluZyxvaWRjVG9rZW46c3RyaW5nLHNjb3BlczogYW55LHdhbGxldEFkZHJlc3M6c3RyaW5nKSB7XG4gIGNvbnN0IG9pZGNDbGllbnQgPSBhd2FpdCBvaWRjTG9naW4oZW52LCBjdWJpc3RPcmdJZCwgb2lkY1Rva2VuLCBzY29wZXMpO1xuICBpZiAoIW9pZGNDbGllbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJQbGVhc2Ugc2VuZCBhIHZhbGlkIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIik7XG4gIH1cbiAgY29uc3Qga2V5cyA9IGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbktleXMoKTtcbiAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiR2l2ZW4gaWRlbnRpdHkgdG9rZW4gaXMgbm90IHRoZSBvd25lciBvZiBnaXZlbiB3YWxsZXQgYWRkcmVzc1wiKTtcbiAgfVxuICBjb25zdCBzZW5kZXJLZXkgPSBrZXlzLmZpbHRlcigoa2V5OiBjcy5LZXkpID0+IGtleS5tYXRlcmlhbElkID09PSB3YWxsZXRBZGRyZXNzKTtcbiAgaWYgKHNlbmRlcktleS5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCIpO1xuICB9XG4gIHJldHVybiBzZW5kZXJLZXlbMF1cbn1cbiJdfQ==