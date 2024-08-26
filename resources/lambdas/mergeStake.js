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
    const tenant = event.identity.resolverContext;
    const tenantId = tenant.id;
    const oidcToken = event.headers?.identity;
    const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenant.id);
    if (cubistConfig == null) {
        return {
            data: null,
            error: "Cubist Configuration not found for the given tenant"
        };
    }
    const cubistOrgId = cubistConfig.orgid;
    const connection = await (0, solanaFunctions_1.getSolConnection)();
    const stakeAccounts = await (0, dbFunctions_1.getStakeAccountPubkeys)(walletAddress, tenantId);
    try {
        const key = await (0, CubeSignerClient_1.getCubistKey)(env, cubistOrgId, oidcToken, ["sign:*"], walletAddress);
        await (0, solanaStake_1.mergeStakeAccounts)(connection, stakeAccounts, key);
        const accounts = await (0, dbFunctions_1.getStakeAccounts)(walletAddress, tenantId);
        return {
            status: 200,
            data: accounts
        };
    }
    catch (e) {
        console.log(e);
        return {
            status: 400,
            data: null,
            error: e
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVyZ2VTdGFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lcmdlU3Rha2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQTJEO0FBQzNELG1EQUE0RjtBQUM1Rix1REFBeUQ7QUFFekQsaUVBQXdEO0FBQ3hELE1BQU0sR0FBRyxHQUFRO0lBQ2YsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksaUNBQWlDO0NBQy9FLENBQUM7QUFDSyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsTUFBTSxhQUFhLEdBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQUM7SUFDaEUsTUFBTSxNQUFNLEdBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUF5QixDQUFDO0lBQ3ZELE1BQU0sUUFBUSxHQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUM7SUFDekIsTUFBTSxTQUFTLEdBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7SUFDeEMsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFlLEVBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQ3RELElBQUksWUFBWSxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3pCLE9BQU87WUFDTCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxxREFBcUQ7U0FDN0QsQ0FBQztJQUNKLENBQUM7SUFDRCxNQUFNLFdBQVcsR0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO0lBRXJDLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxrQ0FBZ0IsR0FBRSxDQUFDO0lBQzVDLE1BQU0sYUFBYSxHQUFDLE1BQU0sSUFBQSxvQ0FBc0IsRUFBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDMUUsSUFBRyxDQUFDO1FBQ0YsTUFBTSxHQUFHLEdBQUMsTUFBTSxJQUFBLCtCQUFZLEVBQUMsR0FBRyxFQUFDLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztRQUNwRixNQUFNLElBQUEsZ0NBQWtCLEVBQUMsVUFBVSxFQUFFLGFBQWEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6RCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsOEJBQWdCLEVBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2pFLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxRQUFRO1NBQ2YsQ0FBQztJQUNKLENBQUM7SUFBQSxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUNkLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWhDVyxRQUFBLE9BQU8sV0FnQ2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtnZXRTb2xDb25uZWN0aW9ufSBmcm9tIFwiLi4vc29sYW5hL3NvbGFuYUZ1bmN0aW9uc1wiO1xuaW1wb3J0IHtnZXRDdWJpc3RDb25maWcsIGdldFN0YWtlQWNjb3VudFB1YmtleXMsIGdldFN0YWtlQWNjb3VudHN9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHttZXJnZVN0YWtlQWNjb3VudHN9IGZyb20gXCIuLi9zb2xhbmEvc29sYW5hU3Rha2VcIjtcbmltcG9ydCB7dGVuYW50fSBmcm9tIFwiLi4vZGIvbW9kZWxzXCI7XG5pbXBvcnQge2dldEN1YmlzdEtleX0gZnJvbSBcIi4uL2N1YmlzdC9DdWJlU2lnbmVyQ2xpZW50XCI7XG5jb25zdCBlbnY6IGFueSA9IHtcbiAgU2lnbmVyQXBpUm9vdDogcHJvY2Vzcy5lbnZbXCJDU19BUElfUk9PVFwiXSA/PyBcImh0dHBzOi8vZ2FtbWEuc2lnbmVyLmN1YmlzdC5kZXZcIlxufTtcbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnkpID0+IHtcbiAgY29uc3Qgd2FsbGV0QWRkcmVzcz1ldmVudC5hcmd1bWVudHM/LmlucHV0Py5zZW5kZXJXYWxsZXRBZGRyZXNzO1xuICBjb25zdCB0ZW5hbnQ9IGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQ7XG4gIGNvbnN0IHRlbmFudElkPXRlbmFudC5pZDtcbiAgY29uc3Qgb2lkY1Rva2VuPWV2ZW50LmhlYWRlcnM/LmlkZW50aXR5O1xuICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50LmlkKTtcbiAgaWYgKGN1YmlzdENvbmZpZyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogXCJDdWJpc3QgQ29uZmlndXJhdGlvbiBub3QgZm91bmQgZm9yIHRoZSBnaXZlbiB0ZW5hbnRcIlxuICAgIH07XG4gIH1cbiAgY29uc3QgY3ViaXN0T3JnSWQ9Y3ViaXN0Q29uZmlnLm9yZ2lkO1xuXG4gIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRTb2xDb25uZWN0aW9uKCk7XG4gIGNvbnN0IHN0YWtlQWNjb3VudHM9YXdhaXQgZ2V0U3Rha2VBY2NvdW50UHVia2V5cyh3YWxsZXRBZGRyZXNzLCB0ZW5hbnRJZCk7XG4gIHRyeXtcbiAgICBjb25zdCBrZXk9YXdhaXQgZ2V0Q3ViaXN0S2V5KGVudixjdWJpc3RPcmdJZCwgb2lkY1Rva2VuLCBbXCJzaWduOipcIl0sIHdhbGxldEFkZHJlc3MpO1xuICAgIGF3YWl0IG1lcmdlU3Rha2VBY2NvdW50cyhjb25uZWN0aW9uLCBzdGFrZUFjY291bnRzLCBrZXkpO1xuICAgIGNvbnN0IGFjY291bnRzID0gYXdhaXQgZ2V0U3Rha2VBY2NvdW50cyh3YWxsZXRBZGRyZXNzLCB0ZW5hbnRJZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgZGF0YTogYWNjb3VudHNcbiAgICB9O1xuICB9Y2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmxvZyhlKVxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZVxuICAgIH07XG4gIH1cbn07XG4iXX0=