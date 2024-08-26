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
        const data = await createUser(event.identity.resolverContext, event.arguments?.input?.tenantUserId, event.headers?.identity);
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
async function createUser(tenant, tenantuserid, oidcToken) {
    console.log("Creating user");
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
                            name
                        });
                        const customer = await (0, dbFunctions_1.createCustomer)({
                            emailid: email ? email : "",
                            name: name ? name : "----",
                            tenantuserid,
                            tenantid: tenant.id,
                            cubistuserid: cubistUserId,
                            isactive: true,
                            isBonusCredit: false,
                            createdat: new Date().toISOString()
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
                        const customer = await (0, dbFunctions_1.getCustomer)(tenantuserid, tenant.id);
                        if (customer != null && customer != undefined) {
                            return { customer, error: null };
                        }
                        else {
                            return {
                                customer: null,
                                error: "customer not found for the given tenantuserid and tenantid"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2lnbmluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0VBQWtEO0FBRWxELGlFQUF5RDtBQUN6RCxtREFBZ0U7QUFFaEUsTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUVLLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDeEQsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFNUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxVQUFVLENBQzNCLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBeUIsRUFDeEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUNwQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FDeEIsQ0FBQztRQUVGLE1BQU0sUUFBUSxHQUFHO1lBQ2YsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDekMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBSztTQUNsQixDQUFDO1FBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFbEMsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lB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N0QsQ0FBQztnQkFDSixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZixNQUFNLENBQUMsQ0FBQztJQUNWLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3MgZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgdGVuYW50IH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHsgZ2V0Q3NDbGllbnQgfSBmcm9tIFwiLi4vY3ViaXN0L0N1YmVTaWduZXJDbGllbnRcIjtcbmltcG9ydCB7IGNyZWF0ZUN1c3RvbWVyLCBnZXRDdXN0b21lciB9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuXG5jb25zdCBlbnY6IGFueSA9IHtcbiAgU2lnbmVyQXBpUm9vdDogcHJvY2Vzcy5lbnZbXCJDU19BUElfUk9PVFwiXSA/PyBcImh0dHBzOi8vZ2FtbWEuc2lnbmVyLmN1YmlzdC5kZXZcIlxufTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQsIGNvbnRleHQpO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGNyZWF0ZVVzZXIoXG4gICAgICBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50LFxuICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8udGVuYW50VXNlcklkLFxuICAgICAgZXZlbnQuaGVhZGVycz8uaWRlbnRpdHlcbiAgICApO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdGF0dXM6IGRhdGEuY3VzdG9tZXIgIT0gbnVsbCA/IDIwMCA6IDQwMCxcbiAgICAgIGRhdGE6IGRhdGEuY3VzdG9tZXIsXG4gICAgICBlcnJvcjogZGF0YS5lcnJvclxuICAgIH07XG4gICAgY29uc29sZS5sb2coXCJjdXN0b21lclwiLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVVzZXIodGVuYW50OiB0ZW5hbnQsIHRlbmFudHVzZXJpZDogc3RyaW5nLCBvaWRjVG9rZW46IHN0cmluZykge1xuICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIHVzZXJcIik7XG5cbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhcImNyZWF0ZVVzZXJcIiwgdGVuYW50LmlkLCB0ZW5hbnR1c2VyaWQpO1xuICAgIGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgZ2V0Q3VzdG9tZXIodGVuYW50dXNlcmlkLCB0ZW5hbnQuaWQpO1xuICAgIGlmIChjdXN0b21lciAhPSBudWxsICYmIGN1c3RvbWVyPy5jdWJpc3R1c2VyaWQpIHtcbiAgICAgIHJldHVybiB7IGN1c3RvbWVyLCBlcnJvcjogbnVsbCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIW9pZGNUb2tlbikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGN1c3RvbWVyOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIlBsZWFzZSBwcm92aWRlIGFuIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIlxuICAgICAgICB9O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IGNsaWVudCwgb3JnLCBvcmdJZCB9ID0gYXdhaXQgZ2V0Q3NDbGllbnQodGVuYW50LmlkKTtcbiAgICAgICAgICBpZiAoY2xpZW50ID09IG51bGwgfHwgb3JnID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgIGN1c3RvbWVyOiBudWxsLFxuICAgICAgICAgICAgICBlcnJvcjogXCJFcnJvciBjcmVhdGluZyBjdWJlc2lnbmVyIGNsaWVudFwiXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0ZWQgY3ViZXNpZ25lciBjbGllbnRcIiwgY2xpZW50KTtcbiAgICAgICAgICBjb25zdCBwcm9vZiA9IGF3YWl0IGNzLkN1YmVTaWduZXJDbGllbnQucHJvdmVPaWRjSWRlbnRpdHkoZW52LCBvcmdJZCwgb2lkY1Rva2VuKTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmVyaWZ5aW5nIGlkZW50aXR5XCIsIHByb29mKTtcblxuICAgICAgICAgIGF3YWl0IG9yZy52ZXJpZnlJZGVudGl0eShwcm9vZik7XG5cbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlZlcmlmaWVkXCIpO1xuXG4gICAgICAgICAgLy9hc3NlcnQocHJvb2YuaWRlbnRpdHksIFwiSWRlbnRpdHkgc2hvdWxkIGJlIHNldCB3aGVuIHByb29mIGlzIG9idGFpbmVkIHVzaW5nIE9JREMgdG9rZW5cIik7XG4gICAgICAgICAgY29uc3QgaXNzID0gcHJvb2YuaWRlbnRpdHkhLmlzcztcbiAgICAgICAgICBjb25zdCBzdWIgPSBwcm9vZi5pZGVudGl0eSEuc3ViO1xuICAgICAgICAgIGNvbnN0IGVtYWlsID0gcHJvb2YuZW1haWw7XG4gICAgICAgICAgY29uc3QgbmFtZSA9IHByb29mLnByZWZlcnJlZF91c2VybmFtZTtcblxuICAgICAgICAgIC8vIElmIHVzZXIgZG9lcyBub3QgZXhpc3QsIGNyZWF0ZSBpdFxuICAgICAgICAgIGlmICghcHJvb2YudXNlcl9pbmZvPy51c2VyX2lkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQ3JlYXRpbmcgT0lEQyB1c2VyICR7ZW1haWx9YCk7XG4gICAgICAgICAgICBjb25zdCBjdWJpc3RVc2VySWQgPSBhd2FpdCBvcmcuY3JlYXRlT2lkY1VzZXIoeyBpc3MsIHN1YiB9LCBlbWFpbCwge1xuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbWVyID0gYXdhaXQgY3JlYXRlQ3VzdG9tZXIoe1xuICAgICAgICAgICAgICBlbWFpbGlkOiBlbWFpbCA/IGVtYWlsIDogXCJcIixcbiAgICAgICAgICAgICAgbmFtZTogbmFtZSA/IG5hbWUgOiBcIi0tLS1cIixcbiAgICAgICAgICAgICAgdGVuYW50dXNlcmlkLFxuICAgICAgICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgICAgICAgICBjdWJpc3R1c2VyaWQ6IGN1YmlzdFVzZXJJZCxcbiAgICAgICAgICAgICAgaXNhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICAgIGlzQm9udXNDcmVkaXQ6IGZhbHNlLFxuICAgICAgICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0ZWQgY3VzdG9tZXJcIiwgY3VzdG9tZXIuaWQpO1xuICAgICAgICAgICAgY29uc3QgY3VzdG9tZXJEYXRhID0ge1xuICAgICAgICAgICAgICBjdWJpc3R1c2VyaWQ6IGN1YmlzdFVzZXJJZCxcbiAgICAgICAgICAgICAgdGVuYW50dXNlcmlkOiB0ZW5hbnR1c2VyaWQsXG4gICAgICAgICAgICAgIHRlbmFudGlkOiB0ZW5hbnQuaWQsXG4gICAgICAgICAgICAgIGVtYWlsaWQ6IGVtYWlsLFxuICAgICAgICAgICAgICBpZDogY3VzdG9tZXIuaWQsXG4gICAgICAgICAgICAgIGNyZWF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4geyBjdXN0b21lcjogY3VzdG9tZXJEYXRhLCBlcnJvcjogbnVsbCB9O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBjdXN0b21lciA9IGF3YWl0IGdldEN1c3RvbWVyKHRlbmFudHVzZXJpZCwgdGVuYW50LmlkKTtcblxuICAgICAgICAgICAgaWYgKGN1c3RvbWVyICE9IG51bGwgJiYgY3VzdG9tZXIgIT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiB7IGN1c3RvbWVyLCBlcnJvcjogbnVsbCB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBjdXN0b21lcjogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJjdXN0b21lciBub3QgZm91bmQgZm9yIHRoZSBnaXZlbiB0ZW5hbnR1c2VyaWQgYW5kIHRlbmFudGlkXCJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgTm90IHZlcmlmaWVkOiAke2V9YCk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGN1c3RvbWVyOiBudWxsLFxuICAgICAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgdmVyaWZpY2F0aW9uXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5sb2coZSk7XG4gICAgdGhyb3cgZTtcbiAgfVxufVxuIl19