"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const data = await createCustomerWallet(event.identity.resolverContext, event.arguments?.input?.tenantUserId, event.arguments?.input?.chainType);
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
async function createCustomerWallet(tenant, tenantuserid, chainType) {
    console.log("Creating user");
    try {
        console.log("createUser", tenant.id, tenantuserid);
        const customer = await (0, dbFunctions_1.getCustomer)(tenantuserid, tenant.id);
        if (customer != null && customer?.cubistuserid) {
            const wallet = await (0, dbFunctions_1.getWalletByCustomer)(tenantuserid, chainType, tenant);
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
                    const wallet = await (0, dbFunctions_1.createWallet)(org, customer.cubistuserid, chainType, customer?.id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlV2FsbGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3JlYXRlV2FsbGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGlFQUF5RDtBQUN6RCxtREFBbUY7QUFFNUUsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN4RCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU1QixNQUFNLElBQUksR0FBRyxNQUFNLG9CQUFvQixDQUNyQyxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQXlCLEVBQ3hDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFDcEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUNsQyxDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUc7WUFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztZQUN2QyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDakIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1NBQ2xCLENBQUM7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoQyxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBMUJXLFFBQUEsT0FBTyxXQTBCbEI7QUFFRixLQUFLLFVBQVUsb0JBQW9CLENB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TSxDQUFDLENBQUM7SUFDVixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcbmltcG9ydCB7IGdldENzQ2xpZW50IH0gZnJvbSBcIi4uL2N1YmlzdC9DdWJlU2lnbmVyQ2xpZW50XCI7XG5pbXBvcnQgeyBjcmVhdGVXYWxsZXQsIGdldEN1c3RvbWVyLCBnZXRXYWxsZXRCeUN1c3RvbWVyIH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50LCBjb250ZXh0KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVDdXN0b21lcldhbGxldChcbiAgICAgIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQsXG4gICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py50ZW5hbnRVc2VySWQsXG4gICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGVcbiAgICApO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdGF0dXM6IGRhdGEud2FsbGV0ICE9IG51bGwgPyAyMDAgOiA0MDAsXG4gICAgICBkYXRhOiBkYXRhLndhbGxldCxcbiAgICAgIGVycm9yOiBkYXRhLmVycm9yXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZyhcIldhbGxldFwiLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbWVyV2FsbGV0KHRlbmFudDogdGVuYW50LCB0ZW5hbnR1c2VyaWQ6IHN0cmluZywgY2hhaW5UeXBlOiBzdHJpbmcpIHtcbiAgY29uc29sZS5sb2coXCJDcmVhdGluZyB1c2VyXCIpO1xuXG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coXCJjcmVhdGVVc2VyXCIsIHRlbmFudC5pZCwgdGVuYW50dXNlcmlkKTtcbiAgICBjb25zdCBjdXN0b21lciA9IGF3YWl0IGdldEN1c3RvbWVyKHRlbmFudHVzZXJpZCwgdGVuYW50LmlkKTtcbiAgICBpZiAoY3VzdG9tZXIgIT0gbnVsbCAmJiBjdXN0b21lcj8uY3ViaXN0dXNlcmlkKSB7XG4gICAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBnZXRXYWxsZXRCeUN1c3RvbWVyKHRlbmFudHVzZXJpZCwgY2hhaW5UeXBlLCB0ZW5hbnQpO1xuICAgICAgaWYgKHdhbGxldCAhPSBudWxsICYmIHdhbGxldCAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHsgd2FsbGV0LCBlcnJvcjogbnVsbCB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGNsaWVudCwgb3JnIH0gPSBhd2FpdCBnZXRDc0NsaWVudCh0ZW5hbnQuaWQpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRlZCBjdWJlc2lnbmVyIGNsaWVudFwiLCBjbGllbnQpO1xuXG4gICAgICAgICAgaWYgKGNsaWVudCA9PSBudWxsIHx8IG9yZyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICB3YWxsZXQ6IG51bGwsXG4gICAgICAgICAgICAgIGVycm9yOiBcIkVycm9yIGNyZWF0aW5nIGN1YmVzaWduZXIgY2xpZW50XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IGNyZWF0ZVdhbGxldChvcmcsIGN1c3RvbWVyLmN1YmlzdHVzZXJpZCwgY2hhaW5UeXBlLCBjdXN0b21lcj8uaWQpO1xuICAgICAgICAgIGlmICgod2FsbGV0ICE9IG51bGwgfHwgd2FsbGV0ICE9IHVuZGVmaW5lZCkgJiYgd2FsbGV0LmRhdGEgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc3QgbmV3V2FsbGV0ID0ge1xuICAgICAgICAgICAgICB3YWxsZXRhZGRyZXNzOiB3YWxsZXQuZGF0YS53YWxsZXRhZGRyZXNzLFxuICAgICAgICAgICAgICBjcmVhdGVkYXQ6IHdhbGxldC5kYXRhLmNyZWF0ZWRhdCxcbiAgICAgICAgICAgICAgY2hhaW50eXBlOiB3YWxsZXQuZGF0YS5jaGFpbnR5cGUsXG4gICAgICAgICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50dXNlcmlkLFxuICAgICAgICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgICAgICAgICBlbWFpbGlkOiBjdXN0b21lci5lbWFpbGlkLFxuICAgICAgICAgICAgICBjdXN0b21lcmlkOiBjdXN0b21lci5pZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgd2FsbGV0OiBuZXdXYWxsZXQsIGVycm9yOiBudWxsIH07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgICAgICAgZXJyb3I6IHdhbGxldC5lcnJvclxuICAgICAgICAgICAgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgTm90IHZlcmlmaWVkOiAke2V9YCk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBcIlBsZWFzZSBzZW5kIGEgdmFsaWQgaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3YWxsZXQ6IG51bGwsXG4gICAgICAgIGVycm9yOiBcIkNyZWF0ZSBjdWJpc3QgdXNlciBmaXJzdFwiXG4gICAgICB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIHRocm93IGU7XG4gIH1cbn1cbiJdfQ==