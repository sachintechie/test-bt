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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const cs = __importStar(require("@cubist-labs/cubesigner-sdk"));
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const dbFunctions_1 = require("../db/dbFunctions");
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const data = await createUser(event.identity.resolverContext, event.arguments?.input?.tenantUserId, event.arguments?.input?.name, event.headers?.identity);
        const response = {
            status: data.customer != null ? 200 : 400,
            data: data.customer,
            error: data.error
        };
        console.log("customer", response);
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
async function createUser(tenant, tenantuserid, username, oidcToken) {
    console.log("Creating admin user");
    try {
        console.log("createUser", tenant.id, tenantuserid);
        const customer = await (0, dbFunctions_1.getCustomer)(tenantuserid, tenant.id);
        if (customer != null && customer?.cubistuserid) {
            return { customer, error: null };
        }
        else {
            if (!oidcToken) {
                return {
                    customer: null,
                    error: "Please provide an identity token for verification"
                };
            }
            else {
                try {
                    const { client, org, orgId } = await (0, CubeSignerClient_1.getCsClient)(tenant.id);
                    if (client == null || org == null) {
                        return {
                            customer: null,
                            error: "Error creating cubesigner client"
                        };
                    }
                    console.log("Created cubesigner client", client);
                    const proof = await cs.CubeSignerClient.proveOidcIdentity(env, orgId, oidcToken);
                    console.log("Verifying identity", proof);
                    await org.verifyIdentity(proof);
                    console.log("Verified");
                    //assert(proof.identity, "Identity should be set when proof is obtained using OIDC token");
                    const iss = proof.identity.iss;
                    const sub = proof.identity.sub;
                    const email = proof.email;
                    const name = proof.preferred_username;
                    // If user does not exist, create it
                    if (!proof.user_info?.user_id) {
                        console.log(`Creating OIDC user ${email}`);
                        const cubistUserId = await org.createOidcUser({ iss, sub }, email, {
                            name, memberRole: "Member"
                        });
                        const customer = await (0, dbFunctions_1.createAdminUser)({
                            emailid: email ? email : "",
                            name: name ? name : username,
                            tenantuserid,
                            tenantid: tenant.id,
                            cubistuserid: cubistUserId,
                            isactive: true,
                            isBonusCredit: false,
                            createdat: new Date().toISOString(),
                        });
                        console.log("Created customer", customer.id);
                        const customerData = {
                            cubistuserid: cubistUserId,
                            tenantuserid: tenantuserid,
                            tenantid: tenant.id,
                            emailid: email,
                            id: customer.id,
                            createdat: new Date().toISOString()
                        };
                        return { customer: customerData, error: null };
                    }
                    else {
                        const customer = await (0, dbFunctions_1.getAdminUser)(tenantuserid, tenant.id);
                        if (customer != null && customer != undefined) {
                            return { customer, error: null };
                        }
                        else {
                            return {
                                customer: null,
                                error: "admin not found for the given tenantuserid and tenantid"
                            };
                        }
                    }
                }
                catch (e) {
                    console.log(`Not verified: ${e}`);
                    return {
                        customer: null,
                        error: "Please send a valid identity token for verification"
                    };
                }
            }
        }
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRtaW5TaWduaW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhZG1pblNpZ25pbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGdFQUFrRDtBQUVsRCxpRUFBeUQ7QUFDekQsbURBQStFO0FBRS9FLE1BQU0sR0FBRyxHQUFRO0lBQ2YsYUFBYSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksaUNBQWlDO0NBQy9FLENBQUM7QUFFSyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLE9BQVksRUFBRSxFQUFFO0lBQ3hELElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLE1BQU0sSUFBSSxHQUFHLE1BQU0sVUFBVSxDQUMzQixLQUFLLENBQUMsUUFBUSxDQUFDLGVBQXlCLEVBQ3hDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFDcEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUM1QixLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FDeEIsQ0FBQztRQUVGLE1BQU0sUUFBUSxHQUFHO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDekMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztTQUNsQixDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFbEMsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FB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QUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUNsQyxPQUFPO3dCQUNMLFFBQVEsRUFBRSxJQUFJO3dCQUNkLEtBQUssRUFBRSxxREFBcUQ7cUJBQzdELENBQUM7Z0JBQ0osQ0FBQztZQUNILENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2YsTUFBTSxDQUFDLENBQUM7SUFDVixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcbmltcG9ydCB7IGdldENzQ2xpZW50IH0gZnJvbSBcIi4uL2N1YmlzdC9DdWJlU2lnbmVyQ2xpZW50XCI7XG5pbXBvcnQgeyBjcmVhdGVBZG1pblVzZXIsIGdldEFkbWluVXNlciwgZ2V0Q3VzdG9tZXIgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcblxuY29uc3QgZW52OiBhbnkgPSB7XG4gIFNpZ25lckFwaVJvb3Q6IHByb2Nlc3MuZW52W1wiQ1NfQVBJX1JPT1RcIl0gPz8gXCJodHRwczovL2dhbW1hLnNpZ25lci5jdWJpc3QuZGV2XCJcbn07XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50LCBjb250ZXh0KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVVc2VyKFxuICAgICAgZXZlbnQuaWRlbnRpdHkucmVzb2x2ZXJDb250ZXh0IGFzIHRlbmFudCxcbiAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFVzZXJJZCxcbiAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/Lm5hbWUsXG4gICAgICBldmVudC5oZWFkZXJzPy5pZGVudGl0eVxuICAgICk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN0YXR1czogZGF0YS5jdXN0b21lciAhPSBudWxsID8gMjAwIDogNDAwLFxuICAgICAgZGF0YTogZGF0YS5jdXN0b21lcixcbiAgICAgIGVycm9yOiBkYXRhLmVycm9yXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZyhcImN1c3RvbWVyXCIsIHJlc3BvbnNlKTtcblxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coXCJJbiBjYXRjaCBCbG9jayBFcnJvclwiLCBlcnIpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZXJyXG4gICAgfTtcbiAgfVxufTtcblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlVXNlcih0ZW5hbnQ6IHRlbmFudCwgdGVuYW50dXNlcmlkOiBzdHJpbmcsIHVzZXJuYW1lIDogc3RyaW5nLG9pZGNUb2tlbjogc3RyaW5nKSB7XG4gIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgYWRtaW4gdXNlclwiKTtcblxuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiY3JlYXRlVXNlclwiLCB0ZW5hbnQuaWQsIHRlbmFudHVzZXJpZCk7XG4gICAgY29uc3QgY3VzdG9tZXIgPSBhd2FpdCBnZXRDdXN0b21lcih0ZW5hbnR1c2VyaWQsIHRlbmFudC5pZCk7XG4gICAgaWYgKGN1c3RvbWVyICE9IG51bGwgJiYgY3VzdG9tZXI/LmN1YmlzdHVzZXJpZCkge1xuICAgICAgcmV0dXJuIHsgY3VzdG9tZXIsIGVycm9yOiBudWxsIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghb2lkY1Rva2VuKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgY3VzdG9tZXI6IG51bGwsXG4gICAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHByb3ZpZGUgYW4gaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgY2xpZW50LCBvcmcsIG9yZ0lkIH0gPSBhd2FpdCBnZXRDc0NsaWVudCh0ZW5hbnQuaWQpO1xuICAgICAgICAgIGlmIChjbGllbnQgPT0gbnVsbCB8fCBvcmcgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgY3VzdG9tZXI6IG51bGwsXG4gICAgICAgICAgICAgIGVycm9yOiBcIkVycm9yIGNyZWF0aW5nIGN1YmVzaWduZXIgY2xpZW50XCJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRlZCBjdWJlc2lnbmVyIGNsaWVudFwiLCBjbGllbnQpO1xuICAgICAgICAgIGNvbnN0IHByb29mID0gYXdhaXQgY3MuQ3ViZVNpZ25lckNsaWVudC5wcm92ZU9pZGNJZGVudGl0eShlbnYsIG9yZ0lkLCBvaWRjVG9rZW4pO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coXCJWZXJpZnlpbmcgaWRlbnRpdHlcIiwgcHJvb2YpO1xuXG4gICAgICAgICAgYXdhaXQgb3JnLnZlcmlmeUlkZW50aXR5KHByb29mKTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmVyaWZpZWRcIik7XG5cbiAgICAgICAgICAvL2Fzc2VydChwcm9vZi5pZGVudGl0eSwgXCJJZGVudGl0eSBzaG91bGQgYmUgc2V0IHdoZW4gcHJvb2YgaXMgb2J0YWluZWQgdXNpbmcgT0lEQyB0b2tlblwiKTtcbiAgICAgICAgICBjb25zdCBpc3MgPSBwcm9vZi5pZGVudGl0eSEuaXNzO1xuICAgICAgICAgIGNvbnN0IHN1YiA9IHByb29mLmlkZW50aXR5IS5zdWI7XG4gICAgICAgICAgY29uc3QgZW1haWwgPSBwcm9vZi5lbWFpbDtcbiAgICAgICAgICBjb25zdCBuYW1lID0gcHJvb2YucHJlZmVycmVkX3VzZXJuYW1lO1xuXG4gICAgICAgICAgLy8gSWYgdXNlciBkb2VzIG5vdCBleGlzdCwgY3JlYXRlIGl0XG4gICAgICAgICAgaWYgKCFwcm9vZi51c2VyX2luZm8/LnVzZXJfaWQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDcmVhdGluZyBPSURDIHVzZXIgJHtlbWFpbH1gKTtcbiAgICAgICAgICAgIGNvbnN0IGN1YmlzdFVzZXJJZCA9IGF3YWl0IG9yZy5jcmVhdGVPaWRjVXNlcih7IGlzcywgc3ViIH0sIGVtYWlsLCB7XG4gICAgICAgICAgICAgIG5hbWUsbWVtYmVyUm9sZTpcIk1lbWJlclwiXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgY3JlYXRlQWRtaW5Vc2VyKHtcbiAgICAgICAgICAgICAgZW1haWxpZDogZW1haWwgPyBlbWFpbCA6IFwiXCIsXG4gICAgICAgICAgICAgIG5hbWU6IG5hbWUgPyBuYW1lIDp1c2VybmFtZSxcbiAgICAgICAgICAgICAgdGVuYW50dXNlcmlkLFxuICAgICAgICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgICAgICAgICBjdWJpc3R1c2VyaWQ6IGN1YmlzdFVzZXJJZCxcbiAgICAgICAgICAgICAgaXNhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgIGlzQm9udXNDcmVkaXQ6IGZhbHNlLFxuICAgICAgICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJDcmVhdGVkIGN1c3RvbWVyXCIsIGN1c3RvbWVyLmlkKTtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbWVyRGF0YSA9IHtcbiAgICAgICAgICAgICAgY3ViaXN0dXNlcmlkOiBjdWJpc3RVc2VySWQsXG4gICAgICAgICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50dXNlcmlkLFxuICAgICAgICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgICAgICAgICBlbWFpbGlkOiBlbWFpbCxcbiAgICAgICAgICAgICAgaWQ6IGN1c3RvbWVyLmlkLFxuICAgICAgICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHsgY3VzdG9tZXI6IGN1c3RvbWVyRGF0YSwgZXJyb3I6IG51bGwgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXIgPSBhd2FpdCBnZXRBZG1pblVzZXIodGVuYW50dXNlcmlkLCB0ZW5hbnQuaWQpO1xuXG4gICAgICAgICAgICBpZiAoY3VzdG9tZXIgIT0gbnVsbCAmJiBjdXN0b21lciAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHsgY3VzdG9tZXIsIGVycm9yOiBudWxsIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIGN1c3RvbWVyOiBudWxsLFxuICAgICAgICAgICAgICAgIGVycm9yOiBcImFkbWluIG5vdCBmb3VuZCBmb3IgdGhlIGdpdmVuIHRlbmFudHVzZXJpZCBhbmQgdGVuYW50aWRcIlxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGBOb3QgdmVyaWZpZWQ6ICR7ZX1gKTtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3VzdG9tZXI6IG51bGwsXG4gICAgICAgICAgICBlcnJvcjogXCJQbGVhc2Ugc2VuZCBhIHZhbGlkIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBjb25zb2xlLmxvZyhlKTtcbiAgICB0aHJvdyBlO1xuICB9XG59XG4iXX0=