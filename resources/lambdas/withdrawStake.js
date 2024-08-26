"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const solanaFunctions_1 = require("../solana/solanaFunctions");
const dbFunctions_1 = require("../db/dbFunctions");
const solanaStake_1 = require("../solana/solanaStake");
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
const handler = async (event) => {
    const walletAddress = event.arguments?.input?.senderWalletAddress;
    const accountPublicKey = event.arguments?.input?.accountPublicKey;
    const tenant = event.identity.resolverContext;
    const tenantId = tenant.id;
    const oidcToken = event.headers?.identity;
    const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenant.id);
    if (cubistConfig == null) {
        return {
            transaction: null,
            error: "Cubist Configuration not found for the given tenant"
        };
    }
    const cubistOrgId = cubistConfig.orgid;
    const connection = await (0, solanaFunctions_1.getSolConnection)();
    try {
        const key = await (0, CubeSignerClient_1.getCubistKey)(env, cubistOrgId, oidcToken, ["sign:*"], walletAddress);
        await (0, solanaStake_1.withdrawFromStakeAccounts)(connection, [accountPublicKey], key);
        return {
            status: 200,
            data: null
        };
    }
    catch (e) {
        return {
            status: 400,
            data: null,
            error: e
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2l0aGRyYXdTdGFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIndpdGhkcmF3U3Rha2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQTJEO0FBQzNELG1EQUE0RjtBQUM1Rix1REFBZ0U7QUFDaEUsaUVBQXlEO0FBR3pELE1BQU0sR0FBRyxHQUFRO0lBQ2YsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksaUNBQWlDO0NBQy9FLENBQUM7QUFFSyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsTUFBTSxhQUFhLEdBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUM7SUFDaEUsTUFBTSxnQkFBZ0IsR0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQztJQUNoRSxNQUFNLE1BQU0sR0FBRSxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQXlCLENBQUM7SUFDdkQsTUFBTSxRQUFRLEdBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztJQUN6QixNQUFNLFNBQVMsR0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztJQUN4QyxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUEsNkJBQWUsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEQsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFLENBQUM7UUFDekIsT0FBTztZQUNMLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLEtBQUssRUFBRSxxREFBcUQ7U0FDN0QsQ0FBQztJQUNKLENBQUM7SUFDRCxNQUFNLFdBQVcsR0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBR3JDLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxrQ0FBZ0IsR0FBRSxDQUFDO0lBQzVDLElBQUcsQ0FBQztRQUNGLE1BQU0sR0FBRyxHQUFDLE1BQU0sSUFBQSwrQkFBWSxFQUFDLEdBQUcsRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFDcEYsTUFBTSxJQUFBLHVDQUF5QixFQUFDLFVBQVUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDckUsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7U0FDWCxDQUFDO0lBQ0osQ0FBQztJQUFBLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDVixPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUEvQlcsUUFBQSxPQUFPLFdBK0JsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7Z2V0U29sQ29ubmVjdGlvbn0gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFGdW5jdGlvbnNcIjtcbmltcG9ydCB7Z2V0Q3ViaXN0Q29uZmlnLCBnZXRTdGFrZUFjY291bnRQdWJrZXlzLCBnZXRTdGFrZUFjY291bnRzfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7d2l0aGRyYXdGcm9tU3Rha2VBY2NvdW50c30gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFTdGFrZVwiO1xuaW1wb3J0IHsgZ2V0Q3ViaXN0S2V5fSBmcm9tIFwiLi4vY3ViaXN0L0N1YmVTaWduZXJDbGllbnRcIjtcbmltcG9ydCB7dGVuYW50fSBmcm9tIFwiLi4vZGIvbW9kZWxzXCI7XG5cbmNvbnN0IGVudjogYW55ID0ge1xuICBTaWduZXJBcGlSb290OiBwcm9jZXNzLmVudltcIkNTX0FQSV9ST09UXCJdID8/IFwiaHR0cHM6Ly9nYW1tYS5zaWduZXIuY3ViaXN0LmRldlwiXG59O1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55KSA9PiB7XG4gIGNvbnN0IHdhbGxldEFkZHJlc3M9ZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uc2VuZGVyV2FsbGV0QWRkcmVzcztcbiAgY29uc3QgYWNjb3VudFB1YmxpY0tleT1ldmVudC5hcmd1bWVudHM/LmlucHV0Py5hY2NvdW50UHVibGljS2V5O1xuICBjb25zdCB0ZW5hbnQ9IGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQ7XG4gIGNvbnN0IHRlbmFudElkPXRlbmFudC5pZDtcbiAgY29uc3Qgb2lkY1Rva2VuPWV2ZW50LmhlYWRlcnM/LmlkZW50aXR5O1xuICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50LmlkKTtcbiAgaWYgKGN1YmlzdENvbmZpZyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgZXJyb3I6IFwiQ3ViaXN0IENvbmZpZ3VyYXRpb24gbm90IGZvdW5kIGZvciB0aGUgZ2l2ZW4gdGVuYW50XCJcbiAgICB9O1xuICB9XG4gIGNvbnN0IGN1YmlzdE9yZ0lkPWN1YmlzdENvbmZpZy5vcmdpZDtcblxuXG4gIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRTb2xDb25uZWN0aW9uKCk7XG4gIHRyeXtcbiAgICBjb25zdCBrZXk9YXdhaXQgZ2V0Q3ViaXN0S2V5KGVudixjdWJpc3RPcmdJZCwgb2lkY1Rva2VuLCBbXCJzaWduOipcIl0sIHdhbGxldEFkZHJlc3MpO1xuICAgIGF3YWl0IHdpdGhkcmF3RnJvbVN0YWtlQWNjb3VudHMoY29ubmVjdGlvbiwgW2FjY291bnRQdWJsaWNLZXldLCBrZXkpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGRhdGE6IG51bGxcbiAgICB9O1xuICB9Y2F0Y2ggKGUpIHtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVcbiAgICB9O1xuICB9XG59O1xuIl19