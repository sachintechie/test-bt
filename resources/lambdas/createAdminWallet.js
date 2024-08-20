"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const data = await createAdminUserWallet(event.identity.resolverContext, event.arguments?.input?.tenantUserId, event.arguments?.input?.chainType);
        const response = {
            status: data.wallet != null ? 200 : 400,
            data: data.wallet,
            error: data.error
        };
        console.log("Wallet", response);
        return response;
    }
    catch (err) {
        console.log("In catch Block Error", err);
        return {
            status: 400,
            data: null,
            error: err
        };
    }
};
exports.handler = handler;
async function createAdminUserWallet(tenant, tenantuserid, chainType) {
    console.log("Creating user");
    try {
        console.log("createUser", tenant.id, tenantuserid);
        const customer = await (0, dbFunctions_1.getAdminUser)(tenantuserid, tenant.id);
        if (customer != null && customer?.cubistuserid) {
            const wallet = await (0, dbFunctions_1.getAdminWalletByAdmin)(tenantuserid, chainType, tenant);
            if (wallet != null && wallet != undefined) {
                return { wallet, error: null };
            }
            else {
                try {
                    const { client, org } = await (0, CubeSignerClient_1.getCsClient)(tenant.id);
                    console.log("Created cubesigner client", client);
                    if (client == null || org == null) {
                        return {
                            wallet: null,
                            error: "Error creating cubesigner client"
                        };
                    }
                    const wallet = await (0, dbFunctions_1.createAdminWallet)(org, customer.cubistuserid, chainType, tenant.id, customer?.id);
                    if ((wallet != null || wallet != undefined) && wallet.data != null) {
                        const newWallet = {
                            walletaddress: wallet.data.walletaddress,
                            createdat: wallet.data.createdat,
                            chaintype: wallet.data.chaintype,
                            tenantuserid: tenantuserid,
                            tenantid: tenant.id,
                            emailid: customer.emailid,
                            customerid: customer.id
                        };
                        return { wallet: newWallet, error: null };
                    }
                    else {
                        return {
                            wallet: null,
                            error: wallet.error
                        };
                    }
                }
                catch (e) {
                    console.log(`Not verified: ${e}`);
                    return {
                        wallet: null,
                        error: "Please send a valid identity token for verification"
                    };
                }
            }
        }
        else {
            return {
                wallet: null,
                error: "Create cubist user first"
            };
        }
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlQWRtaW5XYWxsZXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGVBZG1pbldhbGxldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSxpRUFBeUQ7QUFDekQsbURBQTJJO0FBRXBJLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDeEQsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFNUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxxQkFBcUIsQ0FDdEMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUF5QixFQUN4QyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQ3BDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FDbEMsQ0FBQztRQUVGLE1BQU0sUUFBUSxHQUFHO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDdkMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ2pCLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztTQUNsQixDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFaEMsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQTFCVyxRQUFBLE9BQU8sV0EwQmxCO0FBRUYsS0FBSyxVQUFV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QUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNmLE1BQU0sQ0FBQyxDQUFDO0lBQ1YsQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB0ZW5hbnQgfSBmcm9tIFwiLi4vZGIvbW9kZWxzXCI7XG5pbXBvcnQgeyBnZXRDc0NsaWVudCB9IGZyb20gXCIuLi9jdWJpc3QvQ3ViZVNpZ25lckNsaWVudFwiO1xuaW1wb3J0IHsgY3JlYXRlQWRtaW5XYWxsZXQsIGNyZWF0ZVdhbGxldCwgZ2V0QWRtaW5Vc2VyLCBnZXRBZG1pbldhbGxldEJ5QWRtaW4sIGdldEN1c3RvbWVyLCBnZXRXYWxsZXRCeUN1c3RvbWVyIH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50LCBjb250ZXh0KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVBZG1pblVzZXJXYWxsZXQoXG4gICAgICBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50LFxuICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8udGVuYW50VXNlcklkLFxuICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY2hhaW5UeXBlXG4gICAgKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3RhdHVzOiBkYXRhLndhbGxldCAhPSBudWxsID8gMjAwIDogNDAwLFxuICAgICAgZGF0YTogZGF0YS53YWxsZXQsXG4gICAgICBlcnJvcjogZGF0YS5lcnJvclxuICAgIH07XG4gICAgY29uc29sZS5sb2coXCJXYWxsZXRcIiwgcmVzcG9uc2UpO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVBZG1pblVzZXJXYWxsZXQodGVuYW50OiB0ZW5hbnQsIHRlbmFudHVzZXJpZDogc3RyaW5nLCBjaGFpblR5cGU6IHN0cmluZykge1xuICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIHVzZXJcIik7XG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcImNyZWF0ZVVzZXJcIiwgdGVuYW50LmlkLCB0ZW5hbnR1c2VyaWQpO1xuICAgIGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgZ2V0QWRtaW5Vc2VyKHRlbmFudHVzZXJpZCwgdGVuYW50LmlkKTtcbiAgICBpZiAoY3VzdG9tZXIgIT0gbnVsbCAmJiBjdXN0b21lcj8uY3ViaXN0dXNlcmlkKSB7XG4gICAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBnZXRBZG1pbldhbGxldEJ5QWRtaW4odGVuYW50dXNlcmlkLCBjaGFpblR5cGUsIHRlbmFudCk7XG4gICAgICBpZiAod2FsbGV0ICE9IG51bGwgJiYgd2FsbGV0ICE9IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4geyB3YWxsZXQsIGVycm9yOiBudWxsIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgY2xpZW50LCBvcmcgfSA9IGF3YWl0IGdldENzQ2xpZW50KHRlbmFudC5pZCk7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJDcmVhdGVkIGN1YmVzaWduZXIgY2xpZW50XCIsIGNsaWVudCk7XG5cbiAgICAgICAgICBpZiAoY2xpZW50ID09IG51bGwgfHwgb3JnID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgICAgICAgZXJyb3I6IFwiRXJyb3IgY3JlYXRpbmcgY3ViZXNpZ25lciBjbGllbnRcIlxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgY3JlYXRlQWRtaW5XYWxsZXQob3JnLCBjdXN0b21lci5jdWJpc3R1c2VyaWQsIGNoYWluVHlwZSwgdGVuYW50LmlkLGN1c3RvbWVyPy5pZCk7XG4gICAgICAgICAgaWYgKCh3YWxsZXQgIT0gbnVsbCB8fCB3YWxsZXQgIT0gdW5kZWZpbmVkKSAmJiB3YWxsZXQuZGF0YSAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdXYWxsZXQgPSB7XG4gICAgICAgICAgICAgIHdhbGxldGFkZHJlc3M6IHdhbGxldC5kYXRhLndhbGxldGFkZHJlc3MsXG4gICAgICAgICAgICAgIGNyZWF0ZWRhdDogd2FsbGV0LmRhdGEuY3JlYXRlZGF0LFxuICAgICAgICAgICAgICBjaGFpbnR5cGU6IHdhbGxldC5kYXRhLmNoYWludHlwZSxcbiAgICAgICAgICAgICAgdGVuYW50dXNlcmlkOiB0ZW5hbnR1c2VyaWQsXG4gICAgICAgICAgICAgIHRlbmFudGlkOiB0ZW5hbnQuaWQsXG4gICAgICAgICAgICAgIGVtYWlsaWQ6IGN1c3RvbWVyLmVtYWlsaWQsXG4gICAgICAgICAgICAgIGN1c3RvbWVyaWQ6IGN1c3RvbWVyLmlkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4geyB3YWxsZXQ6IG5ld1dhbGxldCwgZXJyb3I6IG51bGwgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgd2FsbGV0OiBudWxsLFxuICAgICAgICAgICAgICBlcnJvcjogd2FsbGV0LmVycm9yXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBOb3QgdmVyaWZpZWQ6ICR7ZX1gKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgd2FsbGV0OiBudWxsLFxuICAgICAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgdmVyaWZpY2F0aW9uXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiQ3JlYXRlIGN1YmlzdCB1c2VyIGZpcnN0XCJcbiAgICAgIH07XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coZSk7XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuIl19