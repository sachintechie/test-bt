"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solanaTransfer = solanaTransfer;
const models_1 = require("../db/models");
const dbFunctions_1 = require("../db/dbFunctions");
const web3_js_1 = require("@solana/web3.js");
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const solanaSPLTransferGasLess_1 = require("./solanaSPLTransferGasLess");
const solanaFunctions_1 = require("./solanaFunctions");
const utils_1 = require("../utils/utils");
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
async function solanaTransfer(tenant, senderWalletAddress, receiverWalletAddress, amount, symbol, oidcToken, tenantUserId, chainType, tenantTransactionId) {
    (0, utils_1.logWithTrace)("Wallet Address", senderWalletAddress, symbol, "symbol");
    try {
        if (!oidcToken) {
            return {
                wallet: null,
                error: "Please provide an identity token for verification"
            };
        }
        else {
            const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenant.id);
            if (cubistConfig == null) {
                return {
                    transaction: null,
                    error: "Cubist Configuration not found for the given tenant"
                };
            }
            const wallet = await (0, dbFunctions_1.getWalletAndTokenByWalletAddressBySymbol)(senderWalletAddress, tenant, symbol);
            let balance = 0;
            (0, utils_1.logWithTrace)(wallet, "Wallet");
            if (wallet.length == 0) {
                return {
                    transaction: null,
                    error: "Wallet not found for the given wallet address"
                };
            }
            else {
                for (const token of wallet) {
                    if (token.symbol == symbol && symbol === "SOL" && token.customerid != null) {
                        console.log(token, "SOL data");
                        balance = await (0, solanaFunctions_1.getSolBalance)(senderWalletAddress);
                        token.balance = balance;
                        console.log("Balance", balance);
                        if (balance >= amount) {
                            const trx = await transferSOL(senderWalletAddress, receiverWalletAddress, amount, oidcToken, cubistConfig.orgid);
                            if (trx.trxHash != null) {
                                const transactionStatus = await (0, solanaFunctions_1.verifySolanaTransaction)(trx.trxHash);
                                const txStatus = transactionStatus === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                                const transaction = await (0, dbFunctions_1.insertTransaction)(senderWalletAddress, receiverWalletAddress, amount, chainType, symbol, trx.trxHash, tenant.id, token.customerid, token.tokenid, tenantUserId, process.env["SOLANA_NETWORK"] ?? "", txStatus, tenantTransactionId);
                                return { transaction, error: null };
                            }
                            else {
                                return { transaction: null, error: trx.error };
                            }
                        }
                        else {
                            return {
                                transaction: null,
                                error: "Insufficient SOL balance"
                            };
                        }
                    }
                    else if (token.symbol == symbol && symbol !== "SOL" && token.customerid != null) {
                        console.log(token, "Token data");
                        balance = await (0, solanaFunctions_1.getSplTokenBalance)(senderWalletAddress, token.contractaddress ? token.contractaddress : "");
                        console.log("Balance", balance);
                        token.balance = balance;
                        if (balance >= amount && token.decimalprecision != undefined && token.contractaddress != null) {
                            const trx = await (0, solanaSPLTransferGasLess_1.transferSPLToken)(senderWalletAddress, receiverWalletAddress, amount, token.decimalprecision, oidcToken, chainType, token.contractaddress, tenant, cubistConfig.orgid);
                            if (trx.trxHash != null) {
                                const transactionStatus = await (0, solanaFunctions_1.verifySolanaTransaction)(trx.trxHash);
                                const txStatus = transactionStatus === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                                const transaction = await (0, dbFunctions_1.insertTransaction)(senderWalletAddress, receiverWalletAddress, amount, chainType, symbol, trx.trxHash, tenant.id, token.customerid, token.tokenid, tenantUserId, process.env["SOLANA_NETWORK"] ?? "", txStatus, tenantTransactionId);
                                return { transaction, error: null };
                            }
                            else {
                                return { transaction: null, error: trx.error };
                            }
                        }
                        else {
                            return {
                                transaction: null,
                                error: "Insufficient Token balance"
                            };
                        }
                    }
                }
                return { transaction: null, error: "Wallet not found" };
            }
        }
    }
    catch (err) {
        console.log(err);
        return { transaction: null, error: err };
    }
}
async function transferSOL(senderWalletAddress, receiverWalletAddress, amount, oidcToken, cubistOrgId) {
    try {
        const oidcClient = await (0, CubeSignerClient_1.oidcLogin)(env, cubistOrgId, oidcToken, ["sign:*"]);
        if (!oidcClient) {
            return {
                trxHash: null,
                error: "Please send a valid identity token for verification"
            };
        }
        // Just grab the first key for the user
        const keys = await oidcClient.sessionKeys();
        console.log("Keys", keys);
        const key = keys.filter((key) => {
            console.log(key.materialId);
            return key.materialId === senderWalletAddress;
        });
        if (key.length === 0) {
            return {
                trxHash: null,
                error: "Given identity token is not the owner of given wallet address"
            };
        }
        else {
            const connection = await (0, solanaFunctions_1.getSolConnection)();
            const fromPubkey = new web3_js_1.PublicKey(senderWalletAddress);
            const toPubkey = new web3_js_1.PublicKey(receiverWalletAddress);
            const sendingAmount = parseFloat(amount.toString());
            const tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
                fromPubkey,
                toPubkey,
                lamports: sendingAmount * web3_js_1.LAMPORTS_PER_SOL
            }));
            tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            tx.feePayer = fromPubkey;
            const base64 = tx.serializeMessage().toString("base64");
            const resp = await key[0].signSolana({ message_base64: base64 });
            const sig = resp.data().signature;
            // conver the signature 0x... to bytes
            const sigBytes = Buffer.from(sig.slice(2), "hex");
            tx.addSignature(fromPubkey, sigBytes);
            // send transaction
            const txHash = await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(txHash);
            console.log(`txHash: ${txHash}`);
            return { trxHash: txHash, error: null };
        }
    }
    catch (err) {
        console.log(err);
        return { trxHash: null, error: err };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sYW5hVHJhbnNmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb2xhbmFUcmFuc2Zlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWFBLHdDQXFJQztBQWpKRCx5Q0FBeUQ7QUFDekQsbURBQWlIO0FBQ2pILDZDQUEwRjtBQUMxRixpRUFBdUQ7QUFDdkQseUVBQThEO0FBQzlELHVEQUFpSDtBQUNqSCwwQ0FBNEM7QUFFNUMsTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUVLLEtBQUssVUFBVSxjQUFjLENBQ2xDLE1BQWMsRUFDZCxtQkFBMkIsRUFDM0IscUJBQTZCLEVBQzdCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsWUFBb0IsRUFDcEIsU0FBaUIsRUFDakIsbUJBQTJCO0lBRTNCLElBQUEsb0JBQVksRUFBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLEVBQUMsUUFBUSxDQUFDLENBQUM7SUFFcEUsSUFBSSxDQUFDO1FBQ0gsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2YsT0FBTztnQkFDTCxNQUFNLEVBQUUsSUFBSTtnQkFDWixLQUFLLEVBQUUsbURBQW1EO2FBQzNELENBQUM7UUFDSixDQUFDO2FBQU0sQ0FBQztZQUNOLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSw2QkFBZSxFQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0RCxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDekIsT0FBTztvQkFDTCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLHFEQUFxRDtpQkFDN0QsQ0FBQztZQUNKLENBQUM7WUFDRCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsc0RBQXdDLEVBQUMsbUJBQW1CLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ25HLElBQUksT0FBTyxHQUFHLENBQUMsQ0FBQztZQUNoQixJQUFBLG9CQUFZLEVBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQy9CLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDdkIsT0FBTztvQkFDTCxXQUFXLEVBQUUsSUFBSTtvQkFDakIsS0FBSyxFQUFFLCtDQUErQztpQkFDdkQsQ0FBQztZQUNKLENBQUM7aUJBQU0sQ0FBQztnQkFDTixLQUFLLE1BQU0sS0FBSyxJQUFJLE1BQU0sRUFBRSxDQUFDO29CQUUzQixJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksTUFBTSxJQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksS0FBSyxDQUFDLFVBQVUsSUFBSSxJQUFJLEVBQUUsQ0FBQzt3QkFDM0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7d0JBQy9CLE9BQU8sR0FBRyxNQUFNLElBQUEsK0JBQWEsRUFBQyxtQkFBbUIsQ0FBQyxDQUFDO3dCQUNuRCxLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQzt3QkFDeEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7d0JBQ2hDLElBQUksT0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDOzRCQUN0QixNQUFNLEdBQUcsR0FBRyxNQUFNLFdBQVcsQ0FBQyxtQkFBbUIsRUFBRSxxQkFBcUIsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQzs0QkFDakgsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO2dDQUN4QixNQUFNLGlCQUFpQixHQUFHLE1BQU0sSUFBQSx5Q0FBdUIsRUFBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7Z0NBQ3JFLE1BQU0sUUFBUSxHQUFHLGlCQUFpQixLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsMEJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQywwQkFBaUIsQ0FBQyxPQUFPLENBQUM7Z0NBQzNHLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSwrQkFBaUIsRUFDekMsbUJBQW1CLEVBQ25CLHFCQUFxQixFQUNyQixNQUFNLEVBQ04sU0FBUyxFQUNULE1BQU0sRUFDTixHQUFHLENBQUMsT0FBTyxFQUNYLE1BQU0sQ0FBQyxFQUFFLEVBQ1QsS0FBSyxDQUFDLFVBQVUsRUFDaEIsS0FBSyxDQUFDLE9BQU8sRUFDYixZQUFZLEVBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsRUFDbkMsUUFBUSxFQUNSLG1CQUFtQixDQUNwQixDQUFDO2dDQUNGLE9BQU8sRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDOzRCQUN0QyxDQUFDO2lDQUFNLENBQUM7Z0NBQ04sT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0QkFDakQsQ0FBQzt3QkFDSCxDQUFDOzZCQUFNLENBQUM7NEJBQ04sT0FBTztnQ0FDTCxXQUFXLEVBQUUsSUFBSTtnQ0FDakIsS0FBSyxFQUFFLDBCQUEwQjs2QkFDbEMsQ0FBQzt3QkFDSixDQUFDO29CQUNILENBQUM7eUJBQ0ksSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLE1BQU0sSUFBSSxNQUFNLEtBQUssS0FBSyxJQUFJLEtBQUssQ0FBQyxVQUFVLElBQUksSUFBSSxFQUFFLENBQUM7d0JBQ2hGLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO3dCQUVqQyxPQUFPLEdBQUcsTUFBTSxJQUFBLG9DQUFrQixFQUFDLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUM1RyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQzt3QkFDaEMsS0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7d0JBQ3hCLElBQUksT0FBTyxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsZ0JBQWdCLElBQUksU0FBUyxJQUFJLEtBQUssQ0FBQyxlQUFlLElBQUksSUFBSSxFQUFFLENBQUM7NEJBQzlGLE1BQU0sR0FBRyxHQUFHLE1BQU0sSUFBQSwyQ0FBZ0IsRUFDaEMsbUJBQW1CLEVBQ25CLHFCQUFxQixFQUNyQixNQUFNLEVBQ04sS0FBSyxDQUFDLGdCQUFnQixFQUN0QixTQUFTLEVBQ1QsU0FBUyxFQUNULEtBQUssQ0FBQyxlQUFlLEVBQ3JCLE1BQU0sRUFDTixZQUFZLENBQUMsS0FBSyxDQUNuQixDQUFDOzRCQUVGLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQztnQ0FDeEIsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUEseUNBQXVCLEVBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dDQUVyRSxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLDBCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsMEJBQWlCLENBQUMsT0FBTyxDQUFDO2dDQUUzRyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsK0JBQWlCLEVBQ3pDLG1CQUFtQixFQUNuQixxQkFBcUIsRUFDckIsTUFBTSxFQUNOLFNBQVMsRUFDVCxNQUFNLEVBQ04sR0FBRyxDQUFDLE9BQU8sRUFDWCxNQUFNLENBQUMsRUFBRSxFQUNULEtBQUssQ0FBQyxVQUFVLEVBQ2hCLEtBQUssQ0FBQyxPQUFPLEVBQ2IsWUFBWSxFQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEVBQ25DLFFBQVEsRUFDUixtQkFBbUIsQ0FDcEIsQ0FBQztnQ0FDRixPQUFPLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQzs0QkFDdEMsQ0FBQztpQ0FBTSxDQUFDO2dDQUNOLE9BQU8sRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7NEJBQ2pELENBQUM7d0JBQ0gsQ0FBQzs2QkFBTSxDQUFDOzRCQUNOLE9BQU87Z0NBQ0wsV0FBVyxFQUFFLElBQUk7Z0NBQ2pCLEtBQUssRUFBRSw0QkFBNEI7NkJBQ3BDLENBQUM7d0JBQ0osQ0FBQztvQkFDSCxDQUFDO2dCQUVILENBQUM7Z0JBQ0QsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLENBQUM7WUFDMUQsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakIsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDO0lBQzNDLENBQUM7QUFDSCxDQUFDO0FBRUQsS0FBSyxVQUFVLFdBQVcsQ0FDeEIsbUJBQTJCLEVBQzNCLHFCQUE2QixFQUM3QixNQUFjLEVBQ2QsU0FBaUIsRUFDakIsV0FBbUI7SUFFbkIsSUFBSSxDQUFDO1FBQ0gsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFBLDRCQUFTLEVBQUMsR0FBRyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBQzVFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPO2dCQUNMLE9BQU8sRUFBRSxJQUFJO2dCQUNiLEtBQUssRUFBRSxxREFBcUQ7YUFDN0QsQ0FBQztRQUNKLENBQUM7UUFDRCx1Q0FBdUM7UUFDdkMsTUFBTSxJQUFJLEdBQUcsTUFBTSxVQUFVLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDMUIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQVcsRUFBRSxFQUFFO1lBQ3RDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1lBQzNCLE9BQU8sR0FBRyxDQUFDLFVBQVUsS0FBSyxtQkFBbUIsQ0FBQTtRQUMvQyxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUNyQixPQUFPO2dCQUNMLE9BQU8sRUFBRSxJQUFJO2dCQUNiLEtBQUssRUFBRSwrREFBK0Q7YUFDdkUsQ0FBQztRQUNKLENBQUM7YUFBTSxDQUFDO1lBQ04sTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFBLGtDQUFnQixHQUFFLENBQUM7WUFDNUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxtQkFBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDdEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBUyxDQUFDLHFCQUFxQixDQUFDLENBQUM7WUFDdEQsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQ3BELE1BQU0sRUFBRSxHQUFHLElBQUkscUJBQVcsRUFBRSxDQUFDLEdBQUcsQ0FDOUIsdUJBQWEsQ0FBQyxRQUFRLENBQUM7Z0JBQ3JCLFVBQVU7Z0JBQ1YsUUFBUTtnQkFDUixRQUFRLEVBQUUsYUFBYSxHQUFHLDBCQUFnQjthQUMzQyxDQUFDLENBQ0gsQ0FBQztZQUNGLEVBQUUsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ3ZFLEVBQUUsQ0FBQyxRQUFRLEdBQUcsVUFBVSxDQUFDO1lBQ3pCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN4RCxNQUFNLElBQUksR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztZQUNqRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsU0FBUyxDQUFDO1lBQ2xDLHNDQUFzQztZQUN0QyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdEMsbUJBQW1CO1lBQ25CLE1BQU0sTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUMxQyxDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHRlbmFudCwgVHJhbnNhY3Rpb25TdGF0dXMgfSBmcm9tIFwiLi4vZGIvbW9kZWxzXCI7XG5pbXBvcnQgeyBnZXRDdWJpc3RDb25maWcsIGdldFdhbGxldEFuZFRva2VuQnlXYWxsZXRBZGRyZXNzQnlTeW1ib2wsIGluc2VydFRyYW5zYWN0aW9uIH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5pbXBvcnQgeyBMQU1QT1JUU19QRVJfU09MLCBQdWJsaWNLZXksIFN5c3RlbVByb2dyYW0sIFRyYW5zYWN0aW9uIH0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgb2lkY0xvZ2luIH0gZnJvbSBcIi4uL2N1YmlzdC9DdWJlU2lnbmVyQ2xpZW50XCI7XG5pbXBvcnQgeyB0cmFuc2ZlclNQTFRva2VuIH0gZnJvbSBcIi4vc29sYW5hU1BMVHJhbnNmZXJHYXNMZXNzXCI7XG5pbXBvcnQgeyBnZXRTb2xCYWxhbmNlLCBnZXRTb2xDb25uZWN0aW9uLCBnZXRTcGxUb2tlbkJhbGFuY2UsIHZlcmlmeVNvbGFuYVRyYW5zYWN0aW9uIH0gZnJvbSBcIi4vc29sYW5hRnVuY3Rpb25zXCI7XG5pbXBvcnQge2xvZ1dpdGhUcmFjZX0gZnJvbSBcIi4uL3V0aWxzL3V0aWxzXCI7XG5cbmNvbnN0IGVudjogYW55ID0ge1xuICBTaWduZXJBcGlSb290OiBwcm9jZXNzLmVudltcIkNTX0FQSV9ST09UXCJdID8/IFwiaHR0cHM6Ly9nYW1tYS5zaWduZXIuY3ViaXN0LmRldlwiXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc29sYW5hVHJhbnNmZXIoXG4gIHRlbmFudDogdGVuYW50LFxuICBzZW5kZXJXYWxsZXRBZGRyZXNzOiBzdHJpbmcsXG4gIHJlY2VpdmVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBhbW91bnQ6IG51bWJlcixcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIG9pZGNUb2tlbjogc3RyaW5nLFxuICB0ZW5hbnRVc2VySWQ6IHN0cmluZyxcbiAgY2hhaW5UeXBlOiBzdHJpbmcsXG4gIHRlbmFudFRyYW5zYWN0aW9uSWQ6IHN0cmluZ1xuKSB7XG4gIGxvZ1dpdGhUcmFjZShcIldhbGxldCBBZGRyZXNzXCIsIHNlbmRlcldhbGxldEFkZHJlc3Msc3ltYm9sLFwic3ltYm9sXCIpO1xuXG4gIHRyeSB7XG4gICAgaWYgKCFvaWRjVG9rZW4pIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHByb3ZpZGUgYW4gaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50LmlkKTtcbiAgICAgIGlmIChjdWJpc3RDb25maWcgPT0gbnVsbCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIkN1YmlzdCBDb25maWd1cmF0aW9uIG5vdCBmb3VuZCBmb3IgdGhlIGdpdmVuIHRlbmFudFwiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBnZXRXYWxsZXRBbmRUb2tlbkJ5V2FsbGV0QWRkcmVzc0J5U3ltYm9sKHNlbmRlcldhbGxldEFkZHJlc3MsIHRlbmFudCwgc3ltYm9sKTtcbiAgICAgIGxldCBiYWxhbmNlID0gMDtcbiAgICAgIGxvZ1dpdGhUcmFjZSh3YWxsZXQsIFwiV2FsbGV0XCIpO1xuICAgICAgaWYgKHdhbGxldC5sZW5ndGggPT0gMCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIldhbGxldCBub3QgZm91bmQgZm9yIHRoZSBnaXZlbiB3YWxsZXQgYWRkcmVzc1wiXG4gICAgICAgIH07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmb3IgKGNvbnN0IHRva2VuIG9mIHdhbGxldCkge1xuXG4gICAgICAgICAgaWYgKHRva2VuLnN5bWJvbCA9PSBzeW1ib2wgJiYgc3ltYm9sID09PSBcIlNPTFwiICYmIHRva2VuLmN1c3RvbWVyaWQgIT0gbnVsbCkge1xuICAgICAgICAgICAgY29uc29sZS5sb2codG9rZW4sIFwiU09MIGRhdGFcIik7XG4gICAgICAgICAgICBiYWxhbmNlID0gYXdhaXQgZ2V0U29sQmFsYW5jZShzZW5kZXJXYWxsZXRBZGRyZXNzKTtcbiAgICAgICAgICAgIHRva2VuLmJhbGFuY2UgPSBiYWxhbmNlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCYWxhbmNlXCIsIGJhbGFuY2UpO1xuICAgICAgICAgICAgaWYgKGJhbGFuY2UgPj0gYW1vdW50KSB7XG4gICAgICAgICAgICAgIGNvbnN0IHRyeCA9IGF3YWl0IHRyYW5zZmVyU09MKHNlbmRlcldhbGxldEFkZHJlc3MsIHJlY2VpdmVyV2FsbGV0QWRkcmVzcywgYW1vdW50LCBvaWRjVG9rZW4sIGN1YmlzdENvbmZpZy5vcmdpZCk7XG4gICAgICAgICAgICAgIGlmICh0cngudHJ4SGFzaCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb25TdGF0dXMgPSBhd2FpdCB2ZXJpZnlTb2xhbmFUcmFuc2FjdGlvbih0cngudHJ4SGFzaCk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHhTdGF0dXMgPSB0cmFuc2FjdGlvblN0YXR1cyA9PT0gXCJmaW5hbGl6ZWRcIiA/IFRyYW5zYWN0aW9uU3RhdHVzLlNVQ0NFU1MgOiBUcmFuc2FjdGlvblN0YXR1cy5QRU5ESU5HO1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gYXdhaXQgaW5zZXJ0VHJhbnNhY3Rpb24oXG4gICAgICAgICAgICAgICAgICBzZW5kZXJXYWxsZXRBZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzLFxuICAgICAgICAgICAgICAgICAgYW1vdW50LFxuICAgICAgICAgICAgICAgICAgY2hhaW5UeXBlLFxuICAgICAgICAgICAgICAgICAgc3ltYm9sLFxuICAgICAgICAgICAgICAgICAgdHJ4LnRyeEhhc2gsXG4gICAgICAgICAgICAgICAgICB0ZW5hbnQuaWQsXG4gICAgICAgICAgICAgICAgICB0b2tlbi5jdXN0b21lcmlkLFxuICAgICAgICAgICAgICAgICAgdG9rZW4udG9rZW5pZCxcbiAgICAgICAgICAgICAgICAgIHRlbmFudFVzZXJJZCxcbiAgICAgICAgICAgICAgICAgIHByb2Nlc3MuZW52W1wiU09MQU5BX05FVFdPUktcIl0gPz8gXCJcIixcbiAgICAgICAgICAgICAgICAgIHR4U3RhdHVzLFxuICAgICAgICAgICAgICAgICAgdGVuYW50VHJhbnNhY3Rpb25JZFxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHJhbnNhY3Rpb24sIGVycm9yOiBudWxsIH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgdHJhbnNhY3Rpb246IG51bGwsIGVycm9yOiB0cnguZXJyb3IgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICBlcnJvcjogXCJJbnN1ZmZpY2llbnQgU09MIGJhbGFuY2VcIlxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gXG4gICAgICAgICAgZWxzZSBpZiAodG9rZW4uc3ltYm9sID09IHN5bWJvbCAmJiBzeW1ib2wgIT09IFwiU09MXCIgJiYgdG9rZW4uY3VzdG9tZXJpZCAhPSBudWxsKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0b2tlbiwgXCJUb2tlbiBkYXRhXCIpO1xuXG4gICAgICAgICAgICBiYWxhbmNlID0gYXdhaXQgZ2V0U3BsVG9rZW5CYWxhbmNlKHNlbmRlcldhbGxldEFkZHJlc3MsIHRva2VuLmNvbnRyYWN0YWRkcmVzcyA/IHRva2VuLmNvbnRyYWN0YWRkcmVzcyA6IFwiXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJCYWxhbmNlXCIsIGJhbGFuY2UpOyAgXG4gICAgICAgICAgICB0b2tlbi5iYWxhbmNlID0gYmFsYW5jZTtcbiAgICAgICAgICAgIGlmIChiYWxhbmNlID49IGFtb3VudCAmJiB0b2tlbi5kZWNpbWFscHJlY2lzaW9uICE9IHVuZGVmaW5lZCAmJiB0b2tlbi5jb250cmFjdGFkZHJlc3MgIT0gbnVsbCkge1xuICAgICAgICAgICAgICBjb25zdCB0cnggPSBhd2FpdCB0cmFuc2ZlclNQTFRva2VuKFxuICAgICAgICAgICAgICAgIHNlbmRlcldhbGxldEFkZHJlc3MsXG4gICAgICAgICAgICAgICAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzLFxuICAgICAgICAgICAgICAgIGFtb3VudCxcbiAgICAgICAgICAgICAgICB0b2tlbi5kZWNpbWFscHJlY2lzaW9uLFxuICAgICAgICAgICAgICAgIG9pZGNUb2tlbixcbiAgICAgICAgICAgICAgICBjaGFpblR5cGUsXG4gICAgICAgICAgICAgICAgdG9rZW4uY29udHJhY3RhZGRyZXNzLFxuICAgICAgICAgICAgICAgIHRlbmFudCxcbiAgICAgICAgICAgICAgICBjdWJpc3RDb25maWcub3JnaWRcbiAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgICBpZiAodHJ4LnRyeEhhc2ggIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uU3RhdHVzID0gYXdhaXQgdmVyaWZ5U29sYW5hVHJhbnNhY3Rpb24odHJ4LnRyeEhhc2gpO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdHhTdGF0dXMgPSB0cmFuc2FjdGlvblN0YXR1cyA9PT0gXCJmaW5hbGl6ZWRcIiA/IFRyYW5zYWN0aW9uU3RhdHVzLlNVQ0NFU1MgOiBUcmFuc2FjdGlvblN0YXR1cy5QRU5ESU5HO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBhd2FpdCBpbnNlcnRUcmFuc2FjdGlvbihcbiAgICAgICAgICAgICAgICAgIHNlbmRlcldhbGxldEFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICByZWNlaXZlcldhbGxldEFkZHJlc3MsXG4gICAgICAgICAgICAgICAgICBhbW91bnQsXG4gICAgICAgICAgICAgICAgICBjaGFpblR5cGUsXG4gICAgICAgICAgICAgICAgICBzeW1ib2wsXG4gICAgICAgICAgICAgICAgICB0cngudHJ4SGFzaCxcbiAgICAgICAgICAgICAgICAgIHRlbmFudC5pZCxcbiAgICAgICAgICAgICAgICAgIHRva2VuLmN1c3RvbWVyaWQsXG4gICAgICAgICAgICAgICAgICB0b2tlbi50b2tlbmlkLFxuICAgICAgICAgICAgICAgICAgdGVuYW50VXNlcklkLFxuICAgICAgICAgICAgICAgICAgcHJvY2Vzcy5lbnZbXCJTT0xBTkFfTkVUV09SS1wiXSA/PyBcIlwiLFxuICAgICAgICAgICAgICAgICAgdHhTdGF0dXMsXG4gICAgICAgICAgICAgICAgICB0ZW5hbnRUcmFuc2FjdGlvbklkXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0cmFuc2FjdGlvbiwgZXJyb3I6IG51bGwgfTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyB0cmFuc2FjdGlvbjogbnVsbCwgZXJyb3I6IHRyeC5lcnJvciB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgIGVycm9yOiBcIkluc3VmZmljaWVudCBUb2tlbiBiYWxhbmNlXCJcbiAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyB0cmFuc2FjdGlvbjogbnVsbCwgZXJyb3I6IFwiV2FsbGV0IG5vdCBmb3VuZFwiIH07XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHJldHVybiB7IHRyYW5zYWN0aW9uOiBudWxsLCBlcnJvcjogZXJyIH07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdHJhbnNmZXJTT0woXG4gIHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzOiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgY3ViaXN0T3JnSWQ6IHN0cmluZ1xuKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgb2lkY0NsaWVudCA9IGF3YWl0IG9pZGNMb2dpbihlbnYsIGN1YmlzdE9yZ0lkLCBvaWRjVG9rZW4sIFtcInNpZ246KlwiXSk7XG4gICAgaWYgKCFvaWRjQ2xpZW50KSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0cnhIYXNoOiBudWxsLFxuICAgICAgICBlcnJvcjogXCJQbGVhc2Ugc2VuZCBhIHZhbGlkIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIlxuICAgICAgfTtcbiAgICB9XG4gICAgLy8gSnVzdCBncmFiIHRoZSBmaXJzdCBrZXkgZm9yIHRoZSB1c2VyXG4gICAgY29uc3Qga2V5cyA9IGF3YWl0IG9pZGNDbGllbnQuc2Vzc2lvbktleXMoKTtcbiAgICBjb25zb2xlLmxvZyhcIktleXNcIiwga2V5cyk7XG4gICAgY29uc3Qga2V5ID0ga2V5cy5maWx0ZXIoKGtleTogY3MuS2V5KSA9PiB7XG4gICAgICBjb25zb2xlLmxvZyhrZXkubWF0ZXJpYWxJZClcbiAgICAgIHJldHVybiBrZXkubWF0ZXJpYWxJZCA9PT0gc2VuZGVyV2FsbGV0QWRkcmVzc1xuICAgIH0pO1xuXG4gICAgaWYgKGtleS5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyeEhhc2g6IG51bGwsXG4gICAgICAgIGVycm9yOiBcIkdpdmVuIGlkZW50aXR5IHRva2VuIGlzIG5vdCB0aGUgb3duZXIgb2YgZ2l2ZW4gd2FsbGV0IGFkZHJlc3NcIlxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldFNvbENvbm5lY3Rpb24oKTtcbiAgICAgIGNvbnN0IGZyb21QdWJrZXkgPSBuZXcgUHVibGljS2V5KHNlbmRlcldhbGxldEFkZHJlc3MpO1xuICAgICAgY29uc3QgdG9QdWJrZXkgPSBuZXcgUHVibGljS2V5KHJlY2VpdmVyV2FsbGV0QWRkcmVzcyk7XG4gICAgICBjb25zdCBzZW5kaW5nQW1vdW50ID0gcGFyc2VGbG9hdChhbW91bnQudG9TdHJpbmcoKSk7XG4gICAgICBjb25zdCB0eCA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICAgICAgU3lzdGVtUHJvZ3JhbS50cmFuc2Zlcih7XG4gICAgICAgICAgZnJvbVB1YmtleSxcbiAgICAgICAgICB0b1B1YmtleSxcbiAgICAgICAgICBsYW1wb3J0czogc2VuZGluZ0Ftb3VudCAqIExBTVBPUlRTX1BFUl9TT0xcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgICB0eC5yZWNlbnRCbG9ja2hhc2ggPSAoYXdhaXQgY29ubmVjdGlvbi5nZXRMYXRlc3RCbG9ja2hhc2goKSkuYmxvY2toYXNoO1xuICAgICAgdHguZmVlUGF5ZXIgPSBmcm9tUHVia2V5O1xuICAgICAgY29uc3QgYmFzZTY0ID0gdHguc2VyaWFsaXplTWVzc2FnZSgpLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IGtleVswXS5zaWduU29sYW5hKHsgbWVzc2FnZV9iYXNlNjQ6IGJhc2U2NCB9KTtcbiAgICAgIGNvbnN0IHNpZyA9IHJlc3AuZGF0YSgpLnNpZ25hdHVyZTtcbiAgICAgIC8vIGNvbnZlciB0aGUgc2lnbmF0dXJlIDB4Li4uIHRvIGJ5dGVzXG4gICAgICBjb25zdCBzaWdCeXRlcyA9IEJ1ZmZlci5mcm9tKHNpZy5zbGljZSgyKSwgXCJoZXhcIik7XG4gICAgICB0eC5hZGRTaWduYXR1cmUoZnJvbVB1YmtleSwgc2lnQnl0ZXMpO1xuXG4gICAgICAvLyBzZW5kIHRyYW5zYWN0aW9uXG4gICAgICBjb25zdCB0eEhhc2ggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0eC5zZXJpYWxpemUoKSk7XG4gICAgICBhd2FpdCBjb25uZWN0aW9uLmNvbmZpcm1UcmFuc2FjdGlvbih0eEhhc2gpO1xuICAgICAgY29uc29sZS5sb2coYHR4SGFzaDogJHt0eEhhc2h9YCk7XG4gICAgICByZXR1cm4geyB0cnhIYXNoOiB0eEhhc2gsIGVycm9yOiBudWxsIH07XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHJldHVybiB7IHRyeEhhc2g6IG51bGwsIGVycm9yOiBlcnIgfTtcbiAgfVxufVxuIl19