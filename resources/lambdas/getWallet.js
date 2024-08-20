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
        const data = await createUser(event.identity.resolverContext, event.arguments?.input?.tenantUserId, event.headers?.identity, event.arguments?.input?.chainType);
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
async function createUser(tenant, tenantuserid, oidcToken, chainType) {
    try {
        const isExist = await checkCustomerAndWallet(tenantuserid, tenant, chainType, oidcToken);
        if (isExist != null) {
            return isExist;
        }
        else {
            if (!oidcToken) {
                return {
                    wallet: null,
                    error: "Please provide an identity token for verification"
                };
            }
            else {
                try {
                    const { client, org, orgId } = await (0, CubeSignerClient_1.getCsClient)(tenant.id);
                    if (client == null || org == null) {
                        return {
                            wallet: null,
                            error: "Error creating cubesigner client"
                        };
                    }
                    console.log("Created cubesigner client", client);
                    const proof = await cs.CubeSignerClient.proveOidcIdentity(env, orgId || "", oidcToken);
                    console.log("Verifying identity", proof);
                    await org.verifyIdentity(proof);
                    console.log("Verified");
                    //assert(proof.identity, "Identity should be set when proof is obtained using OIDC token");
                    const iss = proof.identity.iss;
                    const sub = proof.identity.sub;
                    const email = proof.email;
                    const name = proof.preferred_username;
                    var cubistUserId = "";
                    // If user does not exist, create it
                    if (!proof.user_info?.user_id) {
                        console.log(`Creating OIDC user ${email}`);
                        cubistUserId = await org.createOidcUser({ iss, sub }, email, {
                            name
                        });
                    }
                    else {
                        cubistUserId = proof.user_info?.user_id;
                    }
                    console.log(`Creating key for user ${cubistUserId}...`);
                    var wallet = await createCustomerAndWallet(cubistUserId, email || "", name || "", tenantuserid, oidcToken, iss, chainType, tenant);
                    return wallet;
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
    }
    catch (e) {
        console.log(e);
        throw e;
    }
}
async function createCustomerAndWallet(cubistUserId, email, name, tenantuserid, oidcToken, iss, chainType, tenant) {
    try {
        console.log(`Creating key for user ${cubistUserId}...`);
        const customer = await (0, dbFunctions_1.createCustomer)({
            emailid: email ? email : "",
            name: name ? name : "----",
            tenantuserid,
            tenantid: tenant.id,
            cubistuserid: cubistUserId,
            isactive: true,
            isBonusCredit: false,
            iss: iss,
            createdat: new Date().toISOString()
        });
        console.log("Created customer", customer.id);
        const wallet = await createWalletByKey(tenant, tenantuserid, oidcToken, chainType, customer);
        console.log("Created wallet", wallet);
        return wallet;
    }
    catch (e) {
        return {
            wallet: null,
            error: e
        };
    }
}
async function createWalletByKey(tenant, tenantuserid, oidcToken, chainType, customer) {
    try {
        const { org, orgId } = await (0, CubeSignerClient_1.getCsClient)(tenant.id);
        const oidcClient = await (0, CubeSignerClient_1.oidcLogin)(env, orgId || "", oidcToken, ["sign:*"]);
        const cubistUser = await oidcClient?.user();
        console.log("Created cubesigner user", oidcClient, cubistUser);
        if (oidcClient == null || (cubistUser != null && cubistUser.email != customer.emailid)) {
            return {
                wallet: null,
                error: "Please send a valid identity token for given tenantuserid"
            };
        }
        const key = await (0, CubeSignerClient_1.getKey)(oidcClient, chainType, customer.cubistuserid);
        console.log("getKey cubesigner user", key, customer.cubistuserid);
        const wallet = await (0, dbFunctions_1.createWalletAndKey)(org, customer.cubistuserid, chainType, customer.id, key);
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
    catch (e) {
        return {
            wallet: null,
            error: e
        };
    }
}
async function checkCustomerAndWallet(tenantuserid, tenant, chainType, oidcToken) {
    // check if customer exists
    // check if wallet exists
    // if wallet exists return wallet
    // if wallet does not exist create wallet
    // return wallet
    try {
        const customerAndWallet = await (0, dbFunctions_1.getCustomerAndWallet)(tenantuserid, chainType, tenant);
        if (customerAndWallet != null) {
            if (customerAndWallet.wallets.length > 0 &&
                customerAndWallet?.wallets[0].walletaddress != null &&
                customerAndWallet.wallets[0].chaintype == chainType) {
                const newWallet = {
                    walletaddress: customerAndWallet.wallets[0].walletaddress,
                    createdat: customerAndWallet.wallets[0].createdat,
                    chaintype: customerAndWallet.wallets[0].chaintype,
                    tenantuserid: tenantuserid,
                    tenantid: tenant.id,
                    emailid: customerAndWallet.emailid,
                    customerid: customerAndWallet.id
                };
                return { wallet: newWallet, error: null };
            }
            else {
                const wallet = createWalletByKey(tenant, tenantuserid, oidcToken, chainType, customerAndWallet);
                return wallet;
            }
        }
        else {
            return null;
        }
    }
    catch (e) {
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0V2FsbGV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0V2FsbGV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0VBQWtEO0FBRWxELGlFQUE0RTtBQUM1RSxtREFBMkc7QUFDM0csTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUVLLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDeEQsSUFBSSxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsTUFBTSxVQUFVLENBQzNCLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBeUIsRUFDeEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUNwQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFDdkIsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUNsQyxDQUFDO1FBRUYsTUFBTSxRQUFRLEdBQUc7WUFDZixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztZQUN2QyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU07WUFDakIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1NBQ2xCLENBQUM7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUVoQyxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBekJXLFFBQUEsT0FBTyxXQXlCbEI7QUFFRixLQUFLLFVBQVUsVUFBVSxDQUFDLE1BQWMsRUFBRSxZQUFvQixFQUFFLFNBQWlCLEVBQUUsU0FBaUI7SUFDbEcsSUFBSSxDQUFDO1FBQ0gsTUFBTSxPQUFPLEdBQUcsTUFBTSxzQkFBc0IsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUN6RixJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUNwQixPQUFPLE9BQU8sQ0FBQztRQUNqQixDQUFDO2FBQU0sQ0FBQztZQUNOLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDZixPQUFPO29CQUNMLE1BQU0sRUFBRSxJQUFJO29CQUNaLEtBQUssRUFBRSxtREFBbUQ7aUJBQzNELENBQUM7WUFDSixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sSUFBSSxDQUFDO29CQUNILE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLE1BQU0sSUFBQSw4QkFBVyxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUQsSUFBSSxNQUFNLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDbEMsT0FBTzs0QkFDTCxNQUFNLEVBQUUsSUFBSTs0QkFDWixLQUFLLEVBQUUsa0NBQWtDO3lCQUMxQyxDQUFDO29CQUNKLENBQUM7b0JBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxNQUFNLENBQUMsQ0FBQztvQkFDakQsTUFBTSxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7b0JBRXZGLE9BQU8sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBRXpDLE1BQU0sR0FBRyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFaEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztvQkFFeEIsMkZBQTJGO29CQUMzRixNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUyxDQUFDLEdBQUcsQ0FBQztvQkFDaEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVMsQ0FBQyxHQUFHLENBQUM7b0JBQ2hDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7b0JBQzFCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztvQkFDdEMsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO29CQUN0QixvQ0FBb0M7b0JBQ3BDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxDQUFDO3dCQUM5QixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUMzQyxZQUFZLEdBQUcsTUFBTSxHQUFHLENBQUMsY0FBYyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRTs0QkFDM0QsSUFBSTt5QkFDTCxDQUFDLENBQUM7b0JBQ0wsQ0FBQzt5QkFBTSxDQUFDO3dCQUNOLFlBQVksR0FBRyxLQUFLLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQztvQkFDMUMsQ0FBQztvQkFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixZQUFZLEtBQUssQ0FBQyxDQUFDO29CQUN4RCxJQUFJLE1BQU0sR0FBRyxNQUFNLHVCQUF1QixDQUN4QyxZQUFZLEVBQ1osS0FBSyxJQUFJLEVBQUUsRUFDWCxJQUFJLElBQUksRUFBRSxFQUNWLFlBQVksRUFDWixTQUFTLEVBQ1QsR0FBRyxFQUNILFNBQVMsRUFDVCxNQUFNLENBQ1AsQ0FBQztvQkFDRixPQUFPLE1BQU0sQ0FBQztnQkFDaEIsQ0FBQztnQkFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO29CQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQ2xDLE9BQU87d0JBQ0wsTUFBTSxFQUFFLElBQUk7d0JBQ1osS0FBSyxFQUFFLHFEQUFxRDtxQkFDN0QsQ0FBQztnQkFDSixDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDZixNQUFNLENBQUMsQ0FBQztJQUNWLENBQUM7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLHVCQUF1QixDQUNwQyxZQUFvQixFQUNwQixLQUFhLEVBQ2IsSUFBWSxFQUNaLFlBQW9CLEVBQ3BCLFNBQWlCLEVBQ2pCLEdBQVcsRUFDWCxTQUFpQixFQUNqQixNQUFjO0lBRWQsSUFBRyxDQUFDO1FBQ0osT0FBTyxDQUFDLEdBQUcsQ0FBQyx5QkFBeUIsWUFBWSxLQUFLLENBQUMsQ0FBQztRQUV4RCxNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsNEJBQWMsRUFBQztZQUNwQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDM0IsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNO1lBQzFCLFlBQVk7WUFDWixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsWUFBWSxFQUFFLFlBQVk7WUFDMUIsUUFBUSxFQUFFLElBQUk7WUFDZCxhQUFhLEVBQUUsS0FBSztZQUNwQixHQUFHLEVBQUUsR0FBRztZQUNSLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU3QyxNQUFNLE1BQU0sR0FBRyxNQUFNLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM5RixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsT0FBTztZQUNMLE1BQU0sRUFBRSxJQUFJO1lBQ1osS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDO0lBQ0osQ0FBQztBQUVELENBQUM7QUFFRCxLQUFLLFVBQVUsaUJBQWlCLENBQUMsTUFBYyxFQUFFLFlBQW9CLEVBQUUsU0FBaUIsRUFBRSxTQUFpQixFQUFFLFFBQWE7SUFDeEgsSUFBRyxDQUFDO1FBQ0osTUFBTSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxNQUFNLElBQUEsOEJBQVcsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFBLDRCQUFTLEVBQUMsR0FBRyxFQUFFLEtBQUssSUFBSSxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1RSxNQUFNLFVBQVUsR0FBRyxNQUFNLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUM1QyxPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvRCxJQUFJLFVBQVUsSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDdkYsT0FBTztnQkFDTCxNQUFNLEVBQUUsSUFBSTtnQkFDWixLQUFLLEVBQUUsMkRBQTJEO2FBQ25FLENBQUM7UUFDSixDQUFDO1FBQ0QsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLHlCQUFNLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ2xFLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxnQ0FBa0IsRUFBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsUUFBUSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNqRyxNQUFNLFNBQVMsR0FBRztZQUNoQixhQUFhLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhO1lBQ3hDLFNBQVMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVM7WUFDaEMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsU0FBUztZQUNoQyxZQUFZLEVBQUUsWUFBWTtZQUMxQixRQUFRLEVBQUUsTUFBTSxDQUFDLEVBQUU7WUFDbkIsT0FBTyxFQUFFLFFBQVEsQ0FBQyxPQUFPO1lBQ3pCLFVBQVUsRUFBRSxRQUFRLENBQUMsRUFBRTtTQUN4QixDQUFDO1FBQ0YsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQzVDLENBQUM7SUFBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1gsT0FBTztZQUNMLE1BQU0sRUFBRSxJQUFJO1lBQ1osS0FBSyxFQUFFLENBQUM7U0FDVCxDQUFDO0lBQ0osQ0FBQztBQUNELENBQUM7QUFFRCxLQUFLLFVBQVUsc0JBQXNCLENBQUMsWUFBb0IsRUFBRSxNQUFjLEVBQUUsU0FBaUIsRUFBRSxTQUFpQjtJQUM5RywyQkFBMkI7SUFDM0IseUJBQXlCO0lBQ3pCLGlDQUFpQztJQUNqQyx5Q0FBeUM7SUFDekMsZ0JBQWdCO0lBQ2xCLElBQUcsQ0FBQztRQUNGLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxJQUFBLGtDQUFvQixFQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDdEYsSUFBSSxpQkFBaUIsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUM5QixJQUNFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQztnQkFDcEMsaUJBQWlCLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsSUFBSSxJQUFJO2dCQUNuRCxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFDbkQsQ0FBQztnQkFDRCxNQUFNLFNBQVMsR0FBRztvQkFDaEIsYUFBYSxFQUFFLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhO29CQUN6RCxTQUFTLEVBQUUsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7b0JBQ2pELFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztvQkFDakQsWUFBWSxFQUFFLFlBQVk7b0JBQzFCLFFBQVEsRUFBRSxNQUFNLENBQUMsRUFBRTtvQkFDbkIsT0FBTyxFQUFFLGlCQUFpQixDQUFDLE9BQU87b0JBQ2xDLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxFQUFFO2lCQUNqQyxDQUFDO2dCQUNGLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUM1QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sTUFBTSxNQUFNLEdBQUcsaUJBQWlCLENBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBQ2hHLE9BQU8sTUFBTSxDQUFDO1lBQ2hCLENBQUM7UUFDSCxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFPLENBQUMsRUFBRSxDQUFDO1FBQ1QsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0FBQ0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcbmltcG9ydCB7IGdldENzQ2xpZW50LCBnZXRLZXksIG9pZGNMb2dpbiB9IGZyb20gXCIuLi9jdWJpc3QvQ3ViZVNpZ25lckNsaWVudFwiO1xuaW1wb3J0IHsgY3JlYXRlQ3VzdG9tZXIsIGNyZWF0ZVdhbGxldCwgY3JlYXRlV2FsbGV0QW5kS2V5LCBnZXRDdXN0b21lckFuZFdhbGxldCB9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuY29uc3QgZW52OiBhbnkgPSB7XG4gIFNpZ25lckFwaVJvb3Q6IHByb2Nlc3MuZW52W1wiQ1NfQVBJX1JPT1RcIl0gPz8gXCJodHRwczovL2dhbW1hLnNpZ25lci5jdWJpc3QuZGV2XCJcbn07XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBjcmVhdGVVc2VyKFxuICAgICAgZXZlbnQuaWRlbnRpdHkucmVzb2x2ZXJDb250ZXh0IGFzIHRlbmFudCxcbiAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFVzZXJJZCxcbiAgICAgIGV2ZW50LmhlYWRlcnM/LmlkZW50aXR5LFxuICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY2hhaW5UeXBlXG4gICAgKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3RhdHVzOiBkYXRhLndhbGxldCAhPSBudWxsID8gMjAwIDogNDAwLFxuICAgICAgZGF0YTogZGF0YS53YWxsZXQsXG4gICAgICBlcnJvcjogZGF0YS5lcnJvclxuICAgIH07XG4gICAgY29uc29sZS5sb2coXCJXYWxsZXRcIiwgcmVzcG9uc2UpO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVVc2VyKHRlbmFudDogdGVuYW50LCB0ZW5hbnR1c2VyaWQ6IHN0cmluZywgb2lkY1Rva2VuOiBzdHJpbmcsIGNoYWluVHlwZTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgaXNFeGlzdCA9IGF3YWl0IGNoZWNrQ3VzdG9tZXJBbmRXYWxsZXQodGVuYW50dXNlcmlkLCB0ZW5hbnQsIGNoYWluVHlwZSwgb2lkY1Rva2VuKTtcbiAgICBpZiAoaXNFeGlzdCAhPSBudWxsKSB7XG4gICAgICByZXR1cm4gaXNFeGlzdDtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKCFvaWRjVG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB3YWxsZXQ6IG51bGwsXG4gICAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHByb3ZpZGUgYW4gaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IHsgY2xpZW50LCBvcmcsIG9yZ0lkIH0gPSBhd2FpdCBnZXRDc0NsaWVudCh0ZW5hbnQuaWQpO1xuICAgICAgICAgIGlmIChjbGllbnQgPT0gbnVsbCB8fCBvcmcgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgd2FsbGV0OiBudWxsLFxuICAgICAgICAgICAgICBlcnJvcjogXCJFcnJvciBjcmVhdGluZyBjdWJlc2lnbmVyIGNsaWVudFwiXG4gICAgICAgICAgICB9O1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmxvZyhcIkNyZWF0ZWQgY3ViZXNpZ25lciBjbGllbnRcIiwgY2xpZW50KTtcbiAgICAgICAgICBjb25zdCBwcm9vZiA9IGF3YWl0IGNzLkN1YmVTaWduZXJDbGllbnQucHJvdmVPaWRjSWRlbnRpdHkoZW52LCBvcmdJZCB8fCBcIlwiLCBvaWRjVG9rZW4pO1xuXG4gICAgICAgICAgY29uc29sZS5sb2coXCJWZXJpZnlpbmcgaWRlbnRpdHlcIiwgcHJvb2YpO1xuXG4gICAgICAgICAgYXdhaXQgb3JnLnZlcmlmeUlkZW50aXR5KHByb29mKTtcblxuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVmVyaWZpZWRcIik7XG5cbiAgICAgICAgICAvL2Fzc2VydChwcm9vZi5pZGVudGl0eSwgXCJJZGVudGl0eSBzaG91bGQgYmUgc2V0IHdoZW4gcHJvb2YgaXMgb2J0YWluZWQgdXNpbmcgT0lEQyB0b2tlblwiKTtcbiAgICAgICAgICBjb25zdCBpc3MgPSBwcm9vZi5pZGVudGl0eSEuaXNzO1xuICAgICAgICAgIGNvbnN0IHN1YiA9IHByb29mLmlkZW50aXR5IS5zdWI7XG4gICAgICAgICAgY29uc3QgZW1haWwgPSBwcm9vZi5lbWFpbDtcbiAgICAgICAgICBjb25zdCBuYW1lID0gcHJvb2YucHJlZmVycmVkX3VzZXJuYW1lO1xuICAgICAgICAgIHZhciBjdWJpc3RVc2VySWQgPSBcIlwiO1xuICAgICAgICAgIC8vIElmIHVzZXIgZG9lcyBub3QgZXhpc3QsIGNyZWF0ZSBpdFxuICAgICAgICAgIGlmICghcHJvb2YudXNlcl9pbmZvPy51c2VyX2lkKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgQ3JlYXRpbmcgT0lEQyB1c2VyICR7ZW1haWx9YCk7XG4gICAgICAgICAgICBjdWJpc3RVc2VySWQgPSBhd2FpdCBvcmcuY3JlYXRlT2lkY1VzZXIoeyBpc3MsIHN1YiB9LCBlbWFpbCwge1xuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3ViaXN0VXNlcklkID0gcHJvb2YudXNlcl9pbmZvPy51c2VyX2lkO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zb2xlLmxvZyhgQ3JlYXRpbmcga2V5IGZvciB1c2VyICR7Y3ViaXN0VXNlcklkfS4uLmApO1xuICAgICAgICAgIHZhciB3YWxsZXQgPSBhd2FpdCBjcmVhdGVDdXN0b21lckFuZFdhbGxldChcbiAgICAgICAgICAgIGN1YmlzdFVzZXJJZCxcbiAgICAgICAgICAgIGVtYWlsIHx8IFwiXCIsXG4gICAgICAgICAgICBuYW1lIHx8IFwiXCIsXG4gICAgICAgICAgICB0ZW5hbnR1c2VyaWQsXG4gICAgICAgICAgICBvaWRjVG9rZW4sXG4gICAgICAgICAgICBpc3MsXG4gICAgICAgICAgICBjaGFpblR5cGUsXG4gICAgICAgICAgICB0ZW5hbnRcbiAgICAgICAgICApO1xuICAgICAgICAgIHJldHVybiB3YWxsZXQ7XG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhgTm90IHZlcmlmaWVkOiAke2V9YCk7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBcIlBsZWFzZSBzZW5kIGEgdmFsaWQgaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZSkge1xuICAgIGNvbnNvbGUubG9nKGUpO1xuICAgIHRocm93IGU7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tZXJBbmRXYWxsZXQoXG4gIGN1YmlzdFVzZXJJZDogc3RyaW5nLFxuICBlbWFpbDogc3RyaW5nLFxuICBuYW1lOiBzdHJpbmcsXG4gIHRlbmFudHVzZXJpZDogc3RyaW5nLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgaXNzOiBzdHJpbmcsXG4gIGNoYWluVHlwZTogc3RyaW5nLFxuICB0ZW5hbnQ6IHRlbmFudFxuKSB7XG4gIHRyeXtcbiAgY29uc29sZS5sb2coYENyZWF0aW5nIGtleSBmb3IgdXNlciAke2N1YmlzdFVzZXJJZH0uLi5gKTtcblxuICBjb25zdCBjdXN0b21lciA9IGF3YWl0IGNyZWF0ZUN1c3RvbWVyKHtcbiAgICBlbWFpbGlkOiBlbWFpbCA/IGVtYWlsIDogXCJcIixcbiAgICBuYW1lOiBuYW1lID8gbmFtZSA6IFwiLS0tLVwiLFxuICAgIHRlbmFudHVzZXJpZCxcbiAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgIGN1YmlzdHVzZXJpZDogY3ViaXN0VXNlcklkLFxuICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgIGlzQm9udXNDcmVkaXQ6IGZhbHNlLFxuICAgIGlzczogaXNzLFxuICAgIGNyZWF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gIH0pO1xuICBjb25zb2xlLmxvZyhcIkNyZWF0ZWQgY3VzdG9tZXJcIiwgY3VzdG9tZXIuaWQpO1xuXG4gIGNvbnN0IHdhbGxldCA9IGF3YWl0IGNyZWF0ZVdhbGxldEJ5S2V5KHRlbmFudCwgdGVuYW50dXNlcmlkLCBvaWRjVG9rZW4sIGNoYWluVHlwZSwgY3VzdG9tZXIpO1xuIGNvbnNvbGUubG9nKFwiQ3JlYXRlZCB3YWxsZXRcIiwgd2FsbGV0KTtcbiAgcmV0dXJuIHdhbGxldDtcbn0gY2F0Y2ggKGUpIHtcbiAgcmV0dXJuIHtcbiAgICB3YWxsZXQ6IG51bGwsXG4gICAgZXJyb3I6IGVcbiAgfTtcbn1cblxufVxuXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVXYWxsZXRCeUtleSh0ZW5hbnQ6IHRlbmFudCwgdGVuYW50dXNlcmlkOiBzdHJpbmcsIG9pZGNUb2tlbjogc3RyaW5nLCBjaGFpblR5cGU6IHN0cmluZywgY3VzdG9tZXI6IGFueSkge1xuICB0cnl7XG4gIGNvbnN0IHsgb3JnLCBvcmdJZCB9ID0gYXdhaXQgZ2V0Q3NDbGllbnQodGVuYW50LmlkKTtcbiAgY29uc3Qgb2lkY0NsaWVudCA9IGF3YWl0IG9pZGNMb2dpbihlbnYsIG9yZ0lkIHx8IFwiXCIsIG9pZGNUb2tlbiwgW1wic2lnbjoqXCJdKTtcbiAgY29uc3QgY3ViaXN0VXNlciA9IGF3YWl0IG9pZGNDbGllbnQ/LnVzZXIoKTtcbiAgY29uc29sZS5sb2coXCJDcmVhdGVkIGN1YmVzaWduZXIgdXNlclwiLCBvaWRjQ2xpZW50LCBjdWJpc3RVc2VyKTtcbiAgaWYgKG9pZGNDbGllbnQgPT0gbnVsbCB8fCAoY3ViaXN0VXNlciAhPSBudWxsICYmIGN1YmlzdFVzZXIuZW1haWwgIT0gY3VzdG9tZXIuZW1haWxpZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2FsbGV0OiBudWxsLFxuICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgZ2l2ZW4gdGVuYW50dXNlcmlkXCJcbiAgICB9O1xuICB9XG4gIGNvbnN0IGtleSA9IGF3YWl0IGdldEtleShvaWRjQ2xpZW50LCBjaGFpblR5cGUsIGN1c3RvbWVyLmN1YmlzdHVzZXJpZCk7XG4gIGNvbnNvbGUubG9nKFwiZ2V0S2V5IGN1YmVzaWduZXIgdXNlclwiLCBrZXksIGN1c3RvbWVyLmN1YmlzdHVzZXJpZCk7XG4gIGNvbnN0IHdhbGxldCA9IGF3YWl0IGNyZWF0ZVdhbGxldEFuZEtleShvcmcsIGN1c3RvbWVyLmN1YmlzdHVzZXJpZCwgY2hhaW5UeXBlLCBjdXN0b21lci5pZCwga2V5KTtcbiAgY29uc3QgbmV3V2FsbGV0ID0ge1xuICAgIHdhbGxldGFkZHJlc3M6IHdhbGxldC5kYXRhLndhbGxldGFkZHJlc3MsXG4gICAgY3JlYXRlZGF0OiB3YWxsZXQuZGF0YS5jcmVhdGVkYXQsXG4gICAgY2hhaW50eXBlOiB3YWxsZXQuZGF0YS5jaGFpbnR5cGUsXG4gICAgdGVuYW50dXNlcmlkOiB0ZW5hbnR1c2VyaWQsXG4gICAgdGVuYW50aWQ6IHRlbmFudC5pZCxcbiAgICBlbWFpbGlkOiBjdXN0b21lci5lbWFpbGlkLFxuICAgIGN1c3RvbWVyaWQ6IGN1c3RvbWVyLmlkXG4gIH07XG4gIHJldHVybiB7IHdhbGxldDogbmV3V2FsbGV0LCBlcnJvcjogbnVsbCB9O1xufSBjYXRjaCAoZSkge1xuICByZXR1cm4ge1xuICAgIHdhbGxldDogbnVsbCxcbiAgICBlcnJvcjogZVxuICB9O1xufVxufVxuXG5hc3luYyBmdW5jdGlvbiBjaGVja0N1c3RvbWVyQW5kV2FsbGV0KHRlbmFudHVzZXJpZDogc3RyaW5nLCB0ZW5hbnQ6IHRlbmFudCwgY2hhaW5UeXBlOiBzdHJpbmcsIG9pZGNUb2tlbjogc3RyaW5nKSB7XG4gIC8vIGNoZWNrIGlmIGN1c3RvbWVyIGV4aXN0c1xuICAvLyBjaGVjayBpZiB3YWxsZXQgZXhpc3RzXG4gIC8vIGlmIHdhbGxldCBleGlzdHMgcmV0dXJuIHdhbGxldFxuICAvLyBpZiB3YWxsZXQgZG9lcyBub3QgZXhpc3QgY3JlYXRlIHdhbGxldFxuICAvLyByZXR1cm4gd2FsbGV0XG50cnl7XG4gIGNvbnN0IGN1c3RvbWVyQW5kV2FsbGV0ID0gYXdhaXQgZ2V0Q3VzdG9tZXJBbmRXYWxsZXQodGVuYW50dXNlcmlkLCBjaGFpblR5cGUsIHRlbmFudCk7XG4gIGlmIChjdXN0b21lckFuZFdhbGxldCAhPSBudWxsKSB7XG4gICAgaWYgKFxuICAgICAgY3VzdG9tZXJBbmRXYWxsZXQud2FsbGV0cy5sZW5ndGggPiAwICYmXG4gICAgICBjdXN0b21lckFuZFdhbGxldD8ud2FsbGV0c1swXS53YWxsZXRhZGRyZXNzICE9IG51bGwgJiZcbiAgICAgIGN1c3RvbWVyQW5kV2FsbGV0LndhbGxldHNbMF0uY2hhaW50eXBlID09IGNoYWluVHlwZVxuICAgICkge1xuICAgICAgY29uc3QgbmV3V2FsbGV0ID0ge1xuICAgICAgICB3YWxsZXRhZGRyZXNzOiBjdXN0b21lckFuZFdhbGxldC53YWxsZXRzWzBdLndhbGxldGFkZHJlc3MsXG4gICAgICAgIGNyZWF0ZWRhdDogY3VzdG9tZXJBbmRXYWxsZXQud2FsbGV0c1swXS5jcmVhdGVkYXQsXG4gICAgICAgIGNoYWludHlwZTogY3VzdG9tZXJBbmRXYWxsZXQud2FsbGV0c1swXS5jaGFpbnR5cGUsXG4gICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50dXNlcmlkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgICBlbWFpbGlkOiBjdXN0b21lckFuZFdhbGxldC5lbWFpbGlkLFxuICAgICAgICBjdXN0b21lcmlkOiBjdXN0b21lckFuZFdhbGxldC5pZFxuICAgICAgfTtcbiAgICAgIHJldHVybiB7IHdhbGxldDogbmV3V2FsbGV0LCBlcnJvcjogbnVsbCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB3YWxsZXQgPSBjcmVhdGVXYWxsZXRCeUtleSh0ZW5hbnQsIHRlbmFudHVzZXJpZCwgb2lkY1Rva2VuLCBjaGFpblR5cGUsIGN1c3RvbWVyQW5kV2FsbGV0KTtcbiAgICAgIHJldHVybiB3YWxsZXQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5jYXRjaCAoZSkge1xuICByZXR1cm4gbnVsbDtcbn1cbn1cbiJdfQ==