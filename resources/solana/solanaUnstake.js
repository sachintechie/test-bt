"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solanaUnStaking = solanaUnStaking;
exports.unstakeSol = unstakeSol;
const models_1 = require("../db/models");
const dbFunctions_1 = require("../db/dbFunctions");
const web3_js_1 = require("@solana/web3.js");
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const solanaFunctions_1 = require("./solanaFunctions");
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
async function solanaUnStaking(tenant, stakeAccountId, senderWalletAddress, stakeAccountPubKey, amount, symbol, oidcToken, tenantUserId, chainType, tenantTransactionId) {
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
            const wallet = await (0, dbFunctions_1.getWallet)(senderWalletAddress);
            const token = await (0, dbFunctions_1.getToken)(symbol);
            if (!wallet) {
                return {
                    transaction: null,
                    error: "Wallet not found for the given wallet address"
                };
            }
            else {
                if (symbol === "SOL" && wallet.customerid != null) {
                    const trx = await unstakeSol(senderWalletAddress, stakeAccountPubKey, amount, oidcToken, cubistConfig.orgid);
                    if (trx.trxHash != null && trx.stakeAccountPubKey != null) {
                        const transactionStatus = await (0, solanaFunctions_1.verifySolanaTransaction)(trx.trxHash);
                        const txStatus = transactionStatus === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                        const transaction = await (0, dbFunctions_1.insertStakingTransaction)(senderWalletAddress, senderWalletAddress, amount, chainType, symbol, trx.trxHash, tenant.id, wallet.customerid, token?.id, tenantUserId, process.env["SOLANA_NETWORK"] ?? "", txStatus, tenantTransactionId, trx.stakeAccountPubKey.toString(), stakeAccountId, models_1.StakeType.UNSTAKE);
                        if (trx.isFullyUnStake) {
                            const stakeAccount = await (0, dbFunctions_1.updateStakeAccount)(stakeAccountId, models_1.StakeAccountStatus.CLOSED, amount);
                        }
                        else {
                            const stakeAccount = await (0, dbFunctions_1.decreaseStakeAmount)(stakeAccountId, amount);
                        }
                        return { transaction: transaction, error: trx.error };
                    }
                    else {
                        return { transaction: null, error: trx.error };
                    }
                }
                else if (symbol != "SOL" && wallet.customerid != null) {
                    return {
                        transaction: null,
                        error: "Not Supported"
                    };
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
async function unstakeSol(senderWalletAddress, stakeAccountPubKey, amount, oidcToken, cubistOrgId) {
    try {
        var isFullyUnStake = false;
        const connection = await (0, solanaFunctions_1.getSolConnection)();
        const oidcClient = await (0, CubeSignerClient_1.oidcLogin)(env, cubistOrgId, oidcToken, ["sign:*"]);
        if (!oidcClient) {
            return {
                trxHash: null,
                stakeAccountPubKey: null,
                error: "Please send a valid identity token for verification"
            };
        }
        const keys = await oidcClient.sessionKeys();
        const senderKey = keys.filter((key) => key.materialId === senderWalletAddress);
        console.log("senderKey", senderKey);
        if (senderKey.length === 0) {
            return {
                trxHash: null,
                error: "Given identity token is not the owner of given wallet address"
            };
        }
        const stakeAccountPubkey = new web3_js_1.PublicKey(stakeAccountPubKey);
        const stakeAccountInfo = await (0, solanaFunctions_1.getStakeAccountInfo)(stakeAccountPubKey, connection);
        console.log("Current Stake Amount", stakeAccountInfo, stakeAccountInfo.currentStakeAmount);
        if (stakeAccountInfo.currentStakeAmount == null) {
            return { trxHash: null, error: "Failed to parse stake account data" };
        }
        if (amount * web3_js_1.LAMPORTS_PER_SOL > stakeAccountInfo.currentStakeAmount) {
            return { trxHash: null, error: "Insufficient staked amount" };
        }
        if (amount * web3_js_1.LAMPORTS_PER_SOL === stakeAccountInfo.currentStakeAmount) {
            console.log("full stake", amount);
            isFullyUnStake = true;
            // Fully deactivate and withdraw the stake
            return await deactivateStake(connection, senderKey[0], stakeAccountPubkey, senderWalletAddress, stakeAccountInfo.currentStakeAmount, isFullyUnStake);
        }
        else {
            console.log("partial stake", amount);
            // Partially withdraw the stake
            return await partiallyDeactivateStake(connection, senderKey[0], stakeAccountPubkey, senderWalletAddress, amount * web3_js_1.LAMPORTS_PER_SOL, isFullyUnStake);
        }
    }
    catch (err) {
        console.log(err);
        return { trxHash: null, error: err };
    }
}
async function deactivateStake(connection, from, stakeAccountPubkey, receiverWalletAddress, amount, isFullyUnStake) {
    const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
    // Deactivate the stake
    let transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.deactivate({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey
    }));
    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    let tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake deactivated with signature:", tx);
    return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}
async function deactivateAndWithdrawStake(connection, from, stakeAccountPubkey, receiverWalletAddress, amount, isFullyUnStake) {
    const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
    // Deactivate the stake
    let transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.deactivate({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey
    }));
    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    let tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake deactivated with signature:", tx);
    // Wait for the cooldown period (typically one epoch) before withdrawing
    // Withdraw the stake
    transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.withdraw({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey,
        toPubkey: new web3_js_1.PublicKey(receiverWalletAddress),
        lamports: amount
    }));
    blockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake withdrawn with signature:", tx);
    return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}
async function partiallyDeactivateStake(connection, from, stakeAccountPubkey, receiverWalletAddress, amount, isFullyUnStake) {
    const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
    const tempStakeAccount = web3_js_1.Keypair.generate();
    // Calculate the rent-exempt reserve
    const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(web3_js_1.StakeProgram.space);
    // Split the stake account
    let transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.split({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey,
        splitStakePubkey: tempStakeAccount.publicKey,
        lamports: amount
    }, lamportsForRentExemption));
    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    transaction.partialSign(tempStakeAccount);
    let tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake account split with signature:", tx);
    await (0, dbFunctions_1.duplicateStakeAccount)(stakeAccountPubkey.toString(), tempStakeAccount.publicKey.toString(), amount);
    await (0, dbFunctions_1.reduceStakeAccountAmount)(stakeAccountPubkey.toString(), amount);
    // Deactivate the split stake account
    transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.deactivate({
        stakePubkey: tempStakeAccount.publicKey,
        authorizedPubkey: fromPublicKey
    }));
    blockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Temporary stake account deactivated with signature:", tx);
    return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}
async function partiallyWithdrawStake(connection, from, stakeAccountPubkey, receiverWalletAddress, amount, isFullyUnStake) {
    const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
    const tempStakeAccount = web3_js_1.Keypair.generate();
    // Calculate the rent-exempt reserve
    const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(web3_js_1.StakeProgram.space);
    // Split the stake account
    let transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.split({
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey,
        splitStakePubkey: tempStakeAccount.publicKey,
        lamports: amount
    }, lamportsForRentExemption));
    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    transaction.partialSign(tempStakeAccount);
    let tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake account split with signature:", tx);
    // Deactivate the split stake account
    transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.deactivate({
        stakePubkey: tempStakeAccount.publicKey,
        authorizedPubkey: fromPublicKey
    }));
    blockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Temporary stake account deactivated with signature:", tx);
    // Wait for the cooldown period (typically one epoch) before withdrawing
    // Withdraw the stake
    transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.withdraw({
        stakePubkey: tempStakeAccount.publicKey,
        authorizedPubkey: fromPublicKey,
        toPubkey: new web3_js_1.PublicKey(receiverWalletAddress),
        lamports: amount
    }));
    blockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Stake withdrawn with signature:", tx);
    return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sYW5hVW5zdGFrZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInNvbGFuYVVuc3Rha2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFrQkEsMENBaUZDO0FBRUQsZ0NBc0VDO0FBMUtELHlDQUF3RjtBQUN4RixtREFNMkI7QUFDM0IsNkNBQThHO0FBQzlHLGlFQUF3RTtBQUN4RSx1REFBbUc7QUFHbkcsTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUVLLEtBQUssVUFBVSxlQUFlLENBQ25DLE1BQWMsRUFDZCxjQUFzQixFQUN0QixtQkFBMkIsRUFDM0Isa0JBQTBCLEVBQzFCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsWUFBb0IsRUFDcEIsU0FBaUIsRUFDakIsbUJBQTJCO0lBRTNCLElBQUksQ0FBQztRQUNILElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNmLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLElBQUk7Z0JBQ1osS0FBSyxFQUFFLG1EQUFtRDthQUMzRCxDQUFDO1FBQ0osQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUEsNkJBQWUsRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEQsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFLENBQUM7Z0JBQ3pCLE9BQU87b0JBQ0wsV0FBVyxFQUFFLElBQUk7b0JBQ2pCLEtBQUssRUFBRSxxREFBcUQ7aUJBQzdELENBQUM7WUFDSixDQUFDO1lBQ0QsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLHVCQUFTLEVBQUMsbUJBQW1CLENBQUMsQ0FBQTtZQUNuRCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUEsc0JBQVEsRUFBQyxNQUFNLENBQUMsQ0FBQTtZQUNwQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ1osT0FBTztvQkFD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Q0FBQyxxQkFBcUIsQ0FBQztRQUM5QyxRQUFRLEVBQUUsTUFBTTtLQUNqQixDQUFDLENBQ0gsQ0FBQztJQUVGLFNBQVMsR0FBRyxDQUFDLE1BQU0sVUFBVSxDQUFDLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDOUQsV0FBVyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUM7SUFDeEMsV0FBVyxDQUFDLFFBQVEsR0FBRyxhQUFhLENBQUM7SUFFckMsTUFBTSxJQUFBLGtDQUFlLEVBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pDLEVBQUUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUNsRSxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN4QyxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRW5ELE9BQU8sRUFBRSxPQUFPLEVBQUUsRUFBRSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDOUYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IFN0YWtlQWNjb3VudFN0YXR1cywgU3Rha2VUeXBlLCB0ZW5hbnQsIFRyYW5zYWN0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHtcbiAgZGVjcmVhc2VTdGFrZUFtb3VudCwgZHVwbGljYXRlU3Rha2VBY2NvdW50LFxuICBnZXRDdWJpc3RDb25maWcsIGdldFRva2VuLCBnZXRXYWxsZXQsXG4gIGdldFdhbGxldEFuZFRva2VuQnlXYWxsZXRBZGRyZXNzLFxuICBpbnNlcnRTdGFraW5nVHJhbnNhY3Rpb24sIHJlZHVjZVN0YWtlQWNjb3VudEFtb3VudCxcbiAgdXBkYXRlU3Rha2VBY2NvdW50XG59IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgQ29ubmVjdGlvbiwgTEFNUE9SVFNfUEVSX1NPTCwgUHVibGljS2V5LCBTdGFrZVByb2dyYW0sIEtleXBhaXIsIFRyYW5zYWN0aW9uIH0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xuaW1wb3J0IHsgb2lkY0xvZ2luLCBzaWduVHJhbnNhY3Rpb24gfSBmcm9tIFwiLi4vY3ViaXN0L0N1YmVTaWduZXJDbGllbnRcIjtcbmltcG9ydCB7IGdldFNvbENvbm5lY3Rpb24sIGdldFN0YWtlQWNjb3VudEluZm8sIHZlcmlmeVNvbGFuYVRyYW5zYWN0aW9uIH0gZnJvbSBcIi4vc29sYW5hRnVuY3Rpb25zXCI7XG5pbXBvcnQgeyBLZXkgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5cbmNvbnN0IGVudjogYW55ID0ge1xuICBTaWduZXJBcGlSb290OiBwcm9jZXNzLmVudltcIkNTX0FQSV9ST09UXCJdID8/IFwiaHR0cHM6Ly9nYW1tYS5zaWduZXIuY3ViaXN0LmRldlwiXG59O1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc29sYW5hVW5TdGFraW5nKFxuICB0ZW5hbnQ6IHRlbmFudCxcbiAgc3Rha2VBY2NvdW50SWQ6IHN0cmluZyxcbiAgc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBzdGFrZUFjY291bnRQdWJLZXk6IHN0cmluZyxcbiAgYW1vdW50OiBudW1iZXIsXG4gIHN5bWJvbDogc3RyaW5nLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgdGVuYW50VXNlcklkOiBzdHJpbmcsXG4gIGNoYWluVHlwZTogc3RyaW5nLFxuICB0ZW5hbnRUcmFuc2FjdGlvbklkOiBzdHJpbmdcbikge1xuICB0cnkge1xuICAgIGlmICghb2lkY1Rva2VuKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB3YWxsZXQ6IG51bGwsXG4gICAgICAgIGVycm9yOiBcIlBsZWFzZSBwcm92aWRlIGFuIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIlxuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY3ViaXN0Q29uZmlnID0gYXdhaXQgZ2V0Q3ViaXN0Q29uZmlnKHRlbmFudC5pZCk7XG4gICAgICBpZiAoY3ViaXN0Q29uZmlnID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbiAgICAgICAgICBlcnJvcjogXCJDdWJpc3QgQ29uZmlndXJhdGlvbiBub3QgZm91bmQgZm9yIHRoZSBnaXZlbiB0ZW5hbnRcIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgZ2V0V2FsbGV0KHNlbmRlcldhbGxldEFkZHJlc3MpXG4gICAgICBjb25zdCB0b2tlbiA9IGF3YWl0IGdldFRva2VuKHN5bWJvbClcbiAgICAgIGlmICghd2FsbGV0KSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHJhbnNhY3Rpb246IG51bGwsXG4gICAgICAgICAgZXJyb3I6IFwiV2FsbGV0IG5vdCBmb3VuZCBmb3IgdGhlIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgICAgICAgfTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzeW1ib2wgPT09IFwiU09MXCIgJiYgd2FsbGV0LmN1c3RvbWVyaWQgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IHRyeCA9IGF3YWl0IHVuc3Rha2VTb2woc2VuZGVyV2FsbGV0QWRkcmVzcywgc3Rha2VBY2NvdW50UHViS2V5LCBhbW91bnQsIG9pZGNUb2tlbiwgY3ViaXN0Q29uZmlnLm9yZ2lkKTtcbiAgICAgICAgICBpZiAodHJ4LnRyeEhhc2ggIT0gbnVsbCAmJiB0cnguc3Rha2VBY2NvdW50UHViS2V5ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uU3RhdHVzID0gYXdhaXQgdmVyaWZ5U29sYW5hVHJhbnNhY3Rpb24odHJ4LnRyeEhhc2gpO1xuICAgICAgICAgICAgY29uc3QgdHhTdGF0dXMgPSB0cmFuc2FjdGlvblN0YXR1cyA9PT0gXCJmaW5hbGl6ZWRcIiA/IFRyYW5zYWN0aW9uU3RhdHVzLlNVQ0NFU1MgOiBUcmFuc2FjdGlvblN0YXR1cy5QRU5ESU5HO1xuXG4gICAgICAgICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGF3YWl0IGluc2VydFN0YWtpbmdUcmFuc2FjdGlvbihcbiAgICAgICAgICAgICAgc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgICAgICAgc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgICAgICAgYW1vdW50LFxuICAgICAgICAgICAgICBjaGFpblR5cGUsXG4gICAgICAgICAgICAgIHN5bWJvbCxcbiAgICAgICAgICAgICAgdHJ4LnRyeEhhc2gsXG4gICAgICAgICAgICAgIHRlbmFudC5pZCxcbiAgICAgICAgICAgICAgd2FsbGV0LmN1c3RvbWVyaWQsXG4gICAgICAgICAgICAgIHRva2VuPy5pZCBhcyBzdHJpbmcsXG4gICAgICAgICAgICAgIHRlbmFudFVzZXJJZCxcbiAgICAgICAgICAgICAgcHJvY2Vzcy5lbnZbXCJTT0xBTkFfTkVUV09SS1wiXSA/PyBcIlwiLFxuICAgICAgICAgICAgICB0eFN0YXR1cyxcbiAgICAgICAgICAgICAgdGVuYW50VHJhbnNhY3Rpb25JZCxcbiAgICAgICAgICAgICAgdHJ4LnN0YWtlQWNjb3VudFB1YktleS50b1N0cmluZygpLFxuICAgICAgICAgICAgICBzdGFrZUFjY291bnRJZCxcbiAgICAgICAgICAgICAgU3Rha2VUeXBlLlVOU1RBS0VcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBpZiAodHJ4LmlzRnVsbHlVblN0YWtlKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YWtlQWNjb3VudCA9IGF3YWl0IHVwZGF0ZVN0YWtlQWNjb3VudChzdGFrZUFjY291bnRJZCwgU3Rha2VBY2NvdW50U3RhdHVzLkNMT1NFRCwgYW1vdW50KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGNvbnN0IHN0YWtlQWNjb3VudCA9IGF3YWl0IGRlY3JlYXNlU3Rha2VBbW91bnQoc3Rha2VBY2NvdW50SWQsIGFtb3VudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4geyB0cmFuc2FjdGlvbjogdHJhbnNhY3Rpb24sIGVycm9yOiB0cnguZXJyb3IgfTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHsgdHJhbnNhY3Rpb246IG51bGwsIGVycm9yOiB0cnguZXJyb3IgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoc3ltYm9sICE9IFwiU09MXCIgJiYgd2FsbGV0LmN1c3RvbWVyaWQgIT0gbnVsbCkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBcIk5vdCBTdXBwb3J0ZWRcIlxuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geyB0cmFuc2FjdGlvbjogbnVsbCwgZXJyb3I6IFwiV2FsbGV0IG5vdCBmb3VuZFwiIH07XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHJldHVybiB7IHRyYW5zYWN0aW9uOiBudWxsLCBlcnJvcjogZXJyIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVuc3Rha2VTb2woXG4gIHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgc3Rha2VBY2NvdW50UHViS2V5OiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgY3ViaXN0T3JnSWQ6IHN0cmluZ1xuKSB7XG4gIHRyeSB7XG4gICAgdmFyIGlzRnVsbHlVblN0YWtlID0gZmFsc2U7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldFNvbENvbm5lY3Rpb24oKTtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gYXdhaXQgb2lkY0xvZ2luKGVudiwgY3ViaXN0T3JnSWQsIG9pZGNUb2tlbiwgW1wic2lnbjoqXCJdKTtcbiAgICBpZiAoIW9pZGNDbGllbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyeEhhc2g6IG51bGwsXG4gICAgICAgIHN0YWtlQWNjb3VudFB1YktleTogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgdmVyaWZpY2F0aW9uXCJcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBvaWRjQ2xpZW50LnNlc3Npb25LZXlzKCk7XG4gICAgY29uc3Qgc2VuZGVyS2V5ID0ga2V5cy5maWx0ZXIoKGtleTogY3MuS2V5KSA9PiBrZXkubWF0ZXJpYWxJZCA9PT0gc2VuZGVyV2FsbGV0QWRkcmVzcyk7XG4gICAgY29uc29sZS5sb2coXCJzZW5kZXJLZXlcIiwgc2VuZGVyS2V5KTtcblxuICAgIGlmIChzZW5kZXJLZXkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0cnhIYXNoOiBudWxsLFxuICAgICAgICBlcnJvcjogXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgICAgIH07XG4gICAgfVxuXG4gICAgY29uc3Qgc3Rha2VBY2NvdW50UHVia2V5ID0gbmV3IFB1YmxpY0tleShzdGFrZUFjY291bnRQdWJLZXkpO1xuICAgIGNvbnN0IHN0YWtlQWNjb3VudEluZm8gPSBhd2FpdCBnZXRTdGFrZUFjY291bnRJbmZvKHN0YWtlQWNjb3VudFB1YktleSwgY29ubmVjdGlvbik7XG5cbiAgICBjb25zb2xlLmxvZyhcIkN1cnJlbnQgU3Rha2UgQW1vdW50XCIsIHN0YWtlQWNjb3VudEluZm8sIHN0YWtlQWNjb3VudEluZm8uY3VycmVudFN0YWtlQW1vdW50KTtcbiAgICBpZiAoc3Rha2VBY2NvdW50SW5mby5jdXJyZW50U3Rha2VBbW91bnQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHsgdHJ4SGFzaDogbnVsbCwgZXJyb3I6IFwiRmFpbGVkIHRvIHBhcnNlIHN0YWtlIGFjY291bnQgZGF0YVwiIH07XG4gICAgfVxuICAgIGlmIChhbW91bnQgKiBMQU1QT1JUU19QRVJfU09MID4gc3Rha2VBY2NvdW50SW5mby5jdXJyZW50U3Rha2VBbW91bnQpIHtcbiAgICAgIHJldHVybiB7IHRyeEhhc2g6IG51bGwsIGVycm9yOiBcIkluc3VmZmljaWVudCBzdGFrZWQgYW1vdW50XCIgfTtcbiAgICB9XG5cbiAgICBpZiAoYW1vdW50ICogTEFNUE9SVFNfUEVSX1NPTCA9PT0gc3Rha2VBY2NvdW50SW5mby5jdXJyZW50U3Rha2VBbW91bnQpIHtcbiAgICAgIGNvbnNvbGUubG9nKFwiZnVsbCBzdGFrZVwiLCBhbW91bnQpO1xuXG4gICAgICBpc0Z1bGx5VW5TdGFrZSA9IHRydWU7XG4gICAgICAvLyBGdWxseSBkZWFjdGl2YXRlIGFuZCB3aXRoZHJhdyB0aGUgc3Rha2VcbiAgICAgIHJldHVybiBhd2FpdCBkZWFjdGl2YXRlU3Rha2UoXG4gICAgICAgIGNvbm5lY3Rpb24sXG4gICAgICAgIHNlbmRlcktleVswXSxcbiAgICAgICAgc3Rha2VBY2NvdW50UHVia2V5LFxuICAgICAgICBzZW5kZXJXYWxsZXRBZGRyZXNzLFxuICAgICAgICBzdGFrZUFjY291bnRJbmZvLmN1cnJlbnRTdGFrZUFtb3VudCxcbiAgICAgICAgaXNGdWxseVVuU3Rha2VcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnNvbGUubG9nKFwicGFydGlhbCBzdGFrZVwiLCBhbW91bnQpO1xuXG4gICAgICAvLyBQYXJ0aWFsbHkgd2l0aGRyYXcgdGhlIHN0YWtlXG4gICAgICByZXR1cm4gYXdhaXQgcGFydGlhbGx5RGVhY3RpdmF0ZVN0YWtlKFxuICAgICAgICBjb25uZWN0aW9uLFxuICAgICAgICBzZW5kZXJLZXlbMF0sXG4gICAgICAgIHN0YWtlQWNjb3VudFB1YmtleSxcbiAgICAgICAgc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgYW1vdW50ICogTEFNUE9SVFNfUEVSX1NPTCxcbiAgICAgICAgaXNGdWxseVVuU3Rha2VcbiAgICAgICk7XG4gICAgfVxuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgcmV0dXJuIHsgdHJ4SGFzaDogbnVsbCwgZXJyb3I6IGVyciB9O1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRlYWN0aXZhdGVTdGFrZShcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgZnJvbTogS2V5LFxuICBzdGFrZUFjY291bnRQdWJrZXk6IFB1YmxpY0tleSxcbiAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzOiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBpc0Z1bGx5VW5TdGFrZTogYm9vbGVhblxuKSB7XG4gIGNvbnN0IGZyb21QdWJsaWNLZXkgPSBuZXcgUHVibGljS2V5KGZyb20ubWF0ZXJpYWxJZCk7XG5cbiAgLy8gRGVhY3RpdmF0ZSB0aGUgc3Rha2VcbiAgbGV0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKFxuICAgIFN0YWtlUHJvZ3JhbS5kZWFjdGl2YXRlKHtcbiAgICAgIHN0YWtlUHVia2V5OiBzdGFrZUFjY291bnRQdWJrZXksXG4gICAgICBhdXRob3JpemVkUHVia2V5OiBmcm9tUHVibGljS2V5XG4gICAgfSlcbiAgKTtcblxuICBsZXQgeyBibG9ja2hhc2ggfSA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0UmVjZW50QmxvY2toYXNoKCk7XG4gIHRyYW5zYWN0aW9uLnJlY2VudEJsb2NraGFzaCA9IGJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24uZmVlUGF5ZXIgPSBmcm9tUHVibGljS2V5O1xuXG4gIGF3YWl0IHNpZ25UcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgZnJvbSk7XG4gIGxldCB0eCA9IGF3YWl0IGNvbm5lY3Rpb24uc2VuZFJhd1RyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLnNlcmlhbGl6ZSgpKTtcbiAgYXdhaXQgY29ubmVjdGlvbi5jb25maXJtVHJhbnNhY3Rpb24odHgpO1xuICBjb25zb2xlLmxvZyhcIlN0YWtlIGRlYWN0aXZhdGVkIHdpdGggc2lnbmF0dXJlOlwiLCB0eCk7XG5cbiAgcmV0dXJuIHsgdHJ4SGFzaDogdHgsIHN0YWtlQWNjb3VudFB1YktleTogc3Rha2VBY2NvdW50UHVia2V5LCBpc0Z1bGx5VW5TdGFrZSwgZXJyb3I6IG51bGwgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZGVhY3RpdmF0ZUFuZFdpdGhkcmF3U3Rha2UoXG4gIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gIGZyb206IEtleSxcbiAgc3Rha2VBY2NvdW50UHVia2V5OiBQdWJsaWNLZXksXG4gIHJlY2VpdmVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBhbW91bnQ6IG51bWJlcixcbiAgaXNGdWxseVVuU3Rha2U6IGJvb2xlYW5cbikge1xuICBjb25zdCBmcm9tUHVibGljS2V5ID0gbmV3IFB1YmxpY0tleShmcm9tLm1hdGVyaWFsSWQpO1xuXG4gIC8vIERlYWN0aXZhdGUgdGhlIHN0YWtlXG4gIGxldCB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICBTdGFrZVByb2dyYW0uZGVhY3RpdmF0ZSh7XG4gICAgICBzdGFrZVB1YmtleTogc3Rha2VBY2NvdW50UHVia2V5LFxuICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleVxuICAgIH0pXG4gICk7XG5cbiAgbGV0IHsgYmxvY2toYXNoIH0gPSBhd2FpdCBjb25uZWN0aW9uLmdldFJlY2VudEJsb2NraGFzaCgpO1xuICB0cmFuc2FjdGlvbi5yZWNlbnRCbG9ja2hhc2ggPSBibG9ja2hhc2g7XG4gIHRyYW5zYWN0aW9uLmZlZVBheWVyID0gZnJvbVB1YmxpY0tleTtcblxuICBhd2FpdCBzaWduVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIGZyb20pO1xuICBsZXQgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29uZmlybVRyYW5zYWN0aW9uKHR4KTtcbiAgY29uc29sZS5sb2coXCJTdGFrZSBkZWFjdGl2YXRlZCB3aXRoIHNpZ25hdHVyZTpcIiwgdHgpO1xuXG4gIC8vIFdhaXQgZm9yIHRoZSBjb29sZG93biBwZXJpb2QgKHR5cGljYWxseSBvbmUgZXBvY2gpIGJlZm9yZSB3aXRoZHJhd2luZ1xuXG4gIC8vIFdpdGhkcmF3IHRoZSBzdGFrZVxuICB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICBTdGFrZVByb2dyYW0ud2l0aGRyYXcoe1xuICAgICAgc3Rha2VQdWJrZXk6IHN0YWtlQWNjb3VudFB1YmtleSxcbiAgICAgIGF1dGhvcml6ZWRQdWJrZXk6IGZyb21QdWJsaWNLZXksXG4gICAgICB0b1B1YmtleTogbmV3IFB1YmxpY0tleShyZWNlaXZlcldhbGxldEFkZHJlc3MpLFxuICAgICAgbGFtcG9ydHM6IGFtb3VudFxuICAgIH0pXG4gICk7XG5cbiAgYmxvY2toYXNoID0gKGF3YWl0IGNvbm5lY3Rpb24uZ2V0UmVjZW50QmxvY2toYXNoKCkpLmJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24ucmVjZW50QmxvY2toYXNoID0gYmxvY2toYXNoO1xuICB0cmFuc2FjdGlvbi5mZWVQYXllciA9IGZyb21QdWJsaWNLZXk7XG5cbiAgYXdhaXQgc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBmcm9tKTtcbiAgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29uZmlybVRyYW5zYWN0aW9uKHR4KTtcbiAgY29uc29sZS5sb2coXCJTdGFrZSB3aXRoZHJhd24gd2l0aCBzaWduYXR1cmU6XCIsIHR4KTtcblxuICByZXR1cm4geyB0cnhIYXNoOiB0eCwgc3Rha2VBY2NvdW50UHViS2V5OiBzdGFrZUFjY291bnRQdWJrZXksIGlzRnVsbHlVblN0YWtlLCBlcnJvcjogbnVsbCB9O1xufVxuXG5hc3luYyBmdW5jdGlvbiBwYXJ0aWFsbHlEZWFjdGl2YXRlU3Rha2UoXG4gIGNvbm5lY3Rpb246IENvbm5lY3Rpb24sXG4gIGZyb206IEtleSxcbiAgc3Rha2VBY2NvdW50UHVia2V5OiBQdWJsaWNLZXksXG4gIHJlY2VpdmVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBhbW91bnQ6IG51bWJlcixcbiAgaXNGdWxseVVuU3Rha2U6IGJvb2xlYW5cbikge1xuICBjb25zdCBmcm9tUHVibGljS2V5ID0gbmV3IFB1YmxpY0tleShmcm9tLm1hdGVyaWFsSWQpO1xuICBjb25zdCB0ZW1wU3Rha2VBY2NvdW50ID0gS2V5cGFpci5nZW5lcmF0ZSgpO1xuICAvLyBDYWxjdWxhdGUgdGhlIHJlbnQtZXhlbXB0IHJlc2VydmVcbiAgY29uc3QgbGFtcG9ydHNGb3JSZW50RXhlbXB0aW9uID0gYXdhaXQgY29ubmVjdGlvbi5nZXRNaW5pbXVtQmFsYW5jZUZvclJlbnRFeGVtcHRpb24oU3Rha2VQcm9ncmFtLnNwYWNlKTtcblxuICAvLyBTcGxpdCB0aGUgc3Rha2UgYWNjb3VudFxuICBsZXQgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgU3Rha2VQcm9ncmFtLnNwbGl0KFxuICAgICAge1xuICAgICAgICBzdGFrZVB1YmtleTogc3Rha2VBY2NvdW50UHVia2V5LFxuICAgICAgICBhdXRob3JpemVkUHVia2V5OiBmcm9tUHVibGljS2V5LFxuICAgICAgICBzcGxpdFN0YWtlUHVia2V5OiB0ZW1wU3Rha2VBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgICAgbGFtcG9ydHM6IGFtb3VudFxuICAgICAgfSxcbiAgICAgIGxhbXBvcnRzRm9yUmVudEV4ZW1wdGlvblxuICAgIClcbiAgKTtcblxuICBsZXQgeyBibG9ja2hhc2ggfSA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0UmVjZW50QmxvY2toYXNoKCk7XG4gIHRyYW5zYWN0aW9uLnJlY2VudEJsb2NraGFzaCA9IGJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24uZmVlUGF5ZXIgPSBmcm9tUHVibGljS2V5O1xuXG4gIGF3YWl0IHNpZ25UcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgZnJvbSk7XG4gIHRyYW5zYWN0aW9uLnBhcnRpYWxTaWduKHRlbXBTdGFrZUFjY291bnQpO1xuICBsZXQgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29uZmlybVRyYW5zYWN0aW9uKHR4KTtcbiAgY29uc29sZS5sb2coXCJTdGFrZSBhY2NvdW50IHNwbGl0IHdpdGggc2lnbmF0dXJlOlwiLCB0eCk7XG5cbiAgYXdhaXQgZHVwbGljYXRlU3Rha2VBY2NvdW50KHN0YWtlQWNjb3VudFB1YmtleS50b1N0cmluZygpLHRlbXBTdGFrZUFjY291bnQucHVibGljS2V5LnRvU3RyaW5nKCksIGFtb3VudCk7XG4gIGF3YWl0IHJlZHVjZVN0YWtlQWNjb3VudEFtb3VudChzdGFrZUFjY291bnRQdWJrZXkudG9TdHJpbmcoKSxhbW91bnQpO1xuXG4gIC8vIERlYWN0aXZhdGUgdGhlIHNwbGl0IHN0YWtlIGFjY291bnRcbiAgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgU3Rha2VQcm9ncmFtLmRlYWN0aXZhdGUoe1xuICAgICAgc3Rha2VQdWJrZXk6IHRlbXBTdGFrZUFjY291bnQucHVibGljS2V5LFxuICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleVxuICAgIH0pXG4gICk7XG5cbiAgYmxvY2toYXNoID0gKGF3YWl0IGNvbm5lY3Rpb24uZ2V0UmVjZW50QmxvY2toYXNoKCkpLmJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24ucmVjZW50QmxvY2toYXNoID0gYmxvY2toYXNoO1xuICB0cmFuc2FjdGlvbi5mZWVQYXllciA9IGZyb21QdWJsaWNLZXk7XG5cbiAgYXdhaXQgc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBmcm9tKTtcbiAgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29uZmlybVRyYW5zYWN0aW9uKHR4KTtcbiAgY29uc29sZS5sb2coXCJUZW1wb3Jhcnkgc3Rha2UgYWNjb3VudCBkZWFjdGl2YXRlZCB3aXRoIHNpZ25hdHVyZTpcIiwgdHgpO1xuXG5cbiAgcmV0dXJuIHsgdHJ4SGFzaDogdHgsIHN0YWtlQWNjb3VudFB1YktleTogc3Rha2VBY2NvdW50UHVia2V5LCBpc0Z1bGx5VW5TdGFrZSwgZXJyb3I6IG51bGwgfTtcbn1cblxuXG5hc3luYyBmdW5jdGlvbiBwYXJ0aWFsbHlXaXRoZHJhd1N0YWtlKFxuICBjb25uZWN0aW9uOiBDb25uZWN0aW9uLFxuICBmcm9tOiBLZXksXG4gIHN0YWtlQWNjb3VudFB1YmtleTogUHVibGljS2V5LFxuICByZWNlaXZlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgYW1vdW50OiBudW1iZXIsXG4gIGlzRnVsbHlVblN0YWtlOiBib29sZWFuXG4pIHtcbiAgY29uc3QgZnJvbVB1YmxpY0tleSA9IG5ldyBQdWJsaWNLZXkoZnJvbS5tYXRlcmlhbElkKTtcbiAgY29uc3QgdGVtcFN0YWtlQWNjb3VudCA9IEtleXBhaXIuZ2VuZXJhdGUoKTtcbiAgLy8gQ2FsY3VsYXRlIHRoZSByZW50LWV4ZW1wdCByZXNlcnZlXG4gIGNvbnN0IGxhbXBvcnRzRm9yUmVudEV4ZW1wdGlvbiA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0TWluaW11bUJhbGFuY2VGb3JSZW50RXhlbXB0aW9uKFN0YWtlUHJvZ3JhbS5zcGFjZSk7XG5cbiAgLy8gU3BsaXQgdGhlIHN0YWtlIGFjY291bnRcbiAgbGV0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKFxuICAgIFN0YWtlUHJvZ3JhbS5zcGxpdChcbiAgICAgIHtcbiAgICAgICAgc3Rha2VQdWJrZXk6IHN0YWtlQWNjb3VudFB1YmtleSxcbiAgICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleSxcbiAgICAgICAgc3BsaXRTdGFrZVB1YmtleTogdGVtcFN0YWtlQWNjb3VudC5wdWJsaWNLZXksXG4gICAgICAgIGxhbXBvcnRzOiBhbW91bnRcbiAgICAgIH0sXG4gICAgICBsYW1wb3J0c0ZvclJlbnRFeGVtcHRpb25cbiAgICApXG4gICk7XG5cbiAgbGV0IHsgYmxvY2toYXNoIH0gPSBhd2FpdCBjb25uZWN0aW9uLmdldFJlY2VudEJsb2NraGFzaCgpO1xuICB0cmFuc2FjdGlvbi5yZWNlbnRCbG9ja2hhc2ggPSBibG9ja2hhc2g7XG4gIHRyYW5zYWN0aW9uLmZlZVBheWVyID0gZnJvbVB1YmxpY0tleTtcblxuICBhd2FpdCBzaWduVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIGZyb20pO1xuICB0cmFuc2FjdGlvbi5wYXJ0aWFsU2lnbih0ZW1wU3Rha2VBY2NvdW50KTtcbiAgbGV0IHR4ID0gYXdhaXQgY29ubmVjdGlvbi5zZW5kUmF3VHJhbnNhY3Rpb24odHJhbnNhY3Rpb24uc2VyaWFsaXplKCkpO1xuICBhd2FpdCBjb25uZWN0aW9uLmNvbmZpcm1UcmFuc2FjdGlvbih0eCk7XG4gIGNvbnNvbGUubG9nKFwiU3Rha2UgYWNjb3VudCBzcGxpdCB3aXRoIHNpZ25hdHVyZTpcIiwgdHgpO1xuXG4gIC8vIERlYWN0aXZhdGUgdGhlIHNwbGl0IHN0YWtlIGFjY291bnRcbiAgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgU3Rha2VQcm9ncmFtLmRlYWN0aXZhdGUoe1xuICAgICAgc3Rha2VQdWJrZXk6IHRlbXBTdGFrZUFjY291bnQucHVibGljS2V5LFxuICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleVxuICAgIH0pXG4gICk7XG5cbiAgYmxvY2toYXNoID0gKGF3YWl0IGNvbm5lY3Rpb24uZ2V0UmVjZW50QmxvY2toYXNoKCkpLmJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24ucmVjZW50QmxvY2toYXNoID0gYmxvY2toYXNoO1xuICB0cmFuc2FjdGlvbi5mZWVQYXllciA9IGZyb21QdWJsaWNLZXk7XG5cbiAgYXdhaXQgc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBmcm9tKTtcbiAgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gIGF3YWl0IGNvbm5lY3Rpb24uY29uZmlybVRyYW5zYWN0aW9uKHR4KTtcbiAgY29uc29sZS5sb2coXCJUZW1wb3Jhcnkgc3Rha2UgYWNjb3VudCBkZWFjdGl2YXRlZCB3aXRoIHNpZ25hdHVyZTpcIiwgdHgpO1xuXG4gIC8vIFdhaXQgZm9yIHRoZSBjb29sZG93biBwZXJpb2QgKHR5cGljYWxseSBvbmUgZXBvY2gpIGJlZm9yZSB3aXRoZHJhd2luZ1xuXG4gIC8vIFdpdGhkcmF3IHRoZSBzdGFrZVxuICB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICBTdGFrZVByb2dyYW0ud2l0aGRyYXcoe1xuICAgICAgc3Rha2VQdWJrZXk6IHRlbXBTdGFrZUFjY291bnQucHVibGljS2V5LFxuICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleSxcbiAgICAgIHRvUHVia2V5OiBuZXcgUHVibGljS2V5KHJlY2VpdmVyV2FsbGV0QWRkcmVzcyksXG4gICAgICBsYW1wb3J0czogYW1vdW50XG4gICAgfSlcbiAgKTtcblxuICBibG9ja2hhc2ggPSAoYXdhaXQgY29ubmVjdGlvbi5nZXRSZWNlbnRCbG9ja2hhc2goKSkuYmxvY2toYXNoO1xuICB0cmFuc2FjdGlvbi5yZWNlbnRCbG9ja2hhc2ggPSBibG9ja2hhc2g7XG4gIHRyYW5zYWN0aW9uLmZlZVBheWVyID0gZnJvbVB1YmxpY0tleTtcblxuICBhd2FpdCBzaWduVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIGZyb20pO1xuICB0eCA9IGF3YWl0IGNvbm5lY3Rpb24uc2VuZFJhd1RyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLnNlcmlhbGl6ZSgpKTtcbiAgYXdhaXQgY29ubmVjdGlvbi5jb25maXJtVHJhbnNhY3Rpb24odHgpO1xuICBjb25zb2xlLmxvZyhcIlN0YWtlIHdpdGhkcmF3biB3aXRoIHNpZ25hdHVyZTpcIiwgdHgpO1xuXG4gIHJldHVybiB7IHRyeEhhc2g6IHR4LCBzdGFrZUFjY291bnRQdWJLZXk6IHN0YWtlQWNjb3VudFB1YmtleSwgaXNGdWxseVVuU3Rha2UsIGVycm9yOiBudWxsIH07XG59XG4iXX0=