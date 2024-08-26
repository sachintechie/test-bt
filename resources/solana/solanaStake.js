"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solanaStaking = solanaStaking;
exports.stakeSol = stakeSol;
exports.withdrawFromStakeAccounts = withdrawFromStakeAccounts;
exports.mergeStakeAccounts = mergeStakeAccounts;
const models_1 = require("../db/models");
const dbFunctions_1 = require("../db/dbFunctions");
const web3_js_1 = require("@solana/web3.js");
const CubeSignerClient_1 = require("../cubist/CubeSignerClient");
const solanaFunctions_1 = require("./solanaFunctions");
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
async function solanaStaking(tenant, senderWalletAddress, receiverWalletAddress, amount, symbol, oidcToken, tenantUserId, chainType, tenantTransactionId, lockupExpirationTimestamp) {
    console.log("[solanaStaking]senderWalletAddress:", senderWalletAddress);
    console.log("[solanaStaking]receiverWalletAddress:", receiverWalletAddress);
    console.log("[solanaStaking]amount:", amount);
    console.log("[solanaStaking]symbol:", symbol);
    console.log("[solanaStaking]oidcToken:", oidcToken);
    console.log("[solanaStaking]tenantUserId:", tenantUserId);
    console.log("[solanaStaking]chainType:", chainType);
    console.log("[solanaStaking]tenantTransactionId:", tenantTransactionId);
    console.log("[solanaStaking]lockupExpirationTimestamp:", lockupExpirationTimestamp);
    // 1. Check if oidcToken exists, if not return error
    if (!oidcToken)
        return {
            wallet: null,
            error: "Please provide an identity token for verification"
        };
    // 2. Get Cubist Configuration, if not found return error
    const cubistConfig = await (0, dbFunctions_1.getCubistConfig)(tenant.id);
    if (cubistConfig == null)
        return {
            transaction: null,
            error: "Cubist Configuration not found for the given tenant"
        };
    // 3. Get first wallet by wallet address, if not found return error
    const wallet = await (0, dbFunctions_1.getWallet)(senderWalletAddress);
    if (!wallet) {
        return {
            transaction: null,
            error: "Wallet not found for the given wallet address"
        };
    }
    // 4. Check the Symbol, if SOL then stake SOL, if not then return error
    if (symbol !== "SOL") {
        return {
            transaction: null,
            error: "Symbol not Supported"
        };
    }
    // 5. Check customer ID, if not found return error
    if (!wallet.customerid) {
        return {
            transaction: null,
            error: "Customer ID not found"
        };
    }
    // 6. Get balance of the wallet, if balance is less than amount return error
    const balance = await (0, solanaFunctions_1.getSolBalance)(senderWalletAddress);
    if (balance < amount) {
        return {
            transaction: null,
            error: "Insufficient SOL balance"
        };
    }
    // 7. Stake SOL
    const tx = await stakeSol(senderWalletAddress, amount, receiverWalletAddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid);
    console.log("[solanaStaking]tx:", tx);
    // 8. Check if transaction is successful, if not return error
    if (tx.error) {
        console.log("[solanaStaking]tx.error:", tx.error);
        return {
            transaction: null,
            error: tx.error
        };
    }
    // 9. Verify the transaction and insert the stake account and staking transaction
    const transactionStatus = await (0, solanaFunctions_1.verifySolanaTransaction)(tx?.trxHash);
    const txStatus = transactionStatus === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
    const stakeAccountStatus = models_1.StakeAccountStatus.OPEN;
    const newStakeAccount = await (0, dbFunctions_1.insertStakeAccount)(senderWalletAddress, receiverWalletAddress, amount, chainType, symbol, tenant.id, wallet.customerid, tenantUserId, process.env["SOLANA_NETWORK"] ?? "", stakeAccountStatus, tenantTransactionId, tx?.stakeAccountPubKey?.toString() || "", lockupExpirationTimestamp);
    const token = await (0, dbFunctions_1.getToken)(symbol);
    const transaction = await (0, dbFunctions_1.insertStakingTransaction)(senderWalletAddress, receiverWalletAddress, amount, chainType, symbol, tx?.trxHash || "", tenant.id, wallet.customerid, token?.id, tenantUserId, process.env["SOLANA_NETWORK"] ?? "", txStatus, tenantTransactionId, tx?.stakeAccountPubKey?.toString() || "", newStakeAccount.id, models_1.StakeType.STAKE);
    console.log("[solanaStaking]transaction:", transaction);
    return { transaction, error: null };
}
async function stakeSol(senderWalletAddress, amount, validatorNodeKey, oidcToken, lockupExpirationTimestamp, cubistOrgId) {
    try {
        const connection = await (0, solanaFunctions_1.getSolConnection)();
        const validatorAddress = new web3_js_1.PublicKey(validatorNodeKey);
        const amountToStake = parseFloat(amount.toString());
        const oidcClient = await (0, CubeSignerClient_1.oidcLogin)(env, cubistOrgId, oidcToken, ["sign:*"]);
        if (!oidcClient) {
            return {
                trxHash: null,
                stakeAccountPubKey: null,
                error: "Please send a valid identity token for verification"
            };
        }
        const keys = await oidcClient.sessionKeys();
        if (keys.length === 0) {
            return {
                trxHash: null,
                error: "Given identity token is not the owner of given wallet address"
            };
        }
        const senderKey = keys.filter((key) => key.materialId === senderWalletAddress);
        if (senderKey.length === 0) {
            return {
                trxHash: null,
                error: "Given identity token is not the owner of given wallet address"
            };
        }
        const staketransaction = await createStakeAccountWithStakeProgram(connection, senderKey[0], amountToStake, validatorAddress, lockupExpirationTimestamp);
        return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };
    }
    catch (err) {
        console.log(await err);
        return { trxHash: null, error: err };
    }
}
async function createStakeAccountWithStakeProgram(connection, from, amount, validatorPubkey, lockupExpirationTimestamp) {
    try {
        const stakeAccount = web3_js_1.Keypair.generate();
        console.log("[createStakeAccountWithStakeProgram]stakeAccount:", stakeAccount.publicKey.toBase58());
        const lamports = amount * web3_js_1.LAMPORTS_PER_SOL;
        const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
        const authorized = new web3_js_1.Authorized(fromPublicKey, fromPublicKey);
        const transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.createAccount({
            fromPubkey: fromPublicKey,
            stakePubkey: stakeAccount.publicKey,
            authorized,
            lamports,
            lockup: new web3_js_1.Lockup(lockupExpirationTimestamp, 0, fromPublicKey)
        }), web3_js_1.StakeProgram.delegate({
            stakePubkey: stakeAccount.publicKey,
            authorizedPubkey: fromPublicKey,
            votePubkey: validatorPubkey
        }));
        const { blockhash } = await connection.getRecentBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPublicKey;
        await (0, CubeSignerClient_1.signTransaction)(transaction, from);
        transaction.partialSign(stakeAccount);
        const tx = await connection.sendRawTransaction(transaction.serialize());
        console.log("[createStakeAccountWithStakeProgram]tx:", tx);
        return { txHash: tx, stakeAccountPubKey: stakeAccount.publicKey };
    }
    catch (err) {
        console.log(`[createStakeAccountWithStakeProgram]err:${err}`);
        throw new Error("Error creating stake account with StakeProgram");
    }
}
async function getLockupDetails(connection, stakeAccountPubkey) {
    try {
        const stakeAccountInfo = await connection.getParsedAccountInfo(stakeAccountPubkey);
        const stakeAccountData = stakeAccountInfo.value?.data;
        if (!stakeAccountData || !("parsed" in stakeAccountData)) {
            throw new Error("Failed to parse stake account data");
        }
        const stakeAccount = stakeAccountData.parsed.info;
        const lockup = stakeAccount.meta.lockup;
        return new web3_js_1.Lockup(lockup.unixTimestamp, lockup.epoch, new web3_js_1.PublicKey(lockup.custodian));
    }
    catch (err) {
        console.error(err);
        throw new Error("Error retrieving lockup details");
    }
}
async function addStakeToExistingAccount(connection, from, existingStakeAccountPubkey, voteAccountPubkey, amount) {
    const fromPublicKey = new web3_js_1.PublicKey(from.materialId);
    const tempStakeAccount = web3_js_1.Keypair.generate();
    const lamportsForStake = amount * web3_js_1.LAMPORTS_PER_SOL;
    const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(web3_js_1.StakeProgram.space);
    const totalLamports = lamportsForStake + lamportsForRentExemption;
    const lockupDetails = await getLockupDetails(connection, existingStakeAccountPubkey);
    const authorized = new web3_js_1.Authorized(fromPublicKey, fromPublicKey);
    // Create and delegate the temporary stake account
    let transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.createAccount({
        fromPubkey: fromPublicKey,
        stakePubkey: tempStakeAccount.publicKey,
        authorized,
        lamports: totalLamports,
        lockup: lockupDetails
    }), web3_js_1.StakeProgram.delegate({
        stakePubkey: tempStakeAccount.publicKey,
        authorizedPubkey: fromPublicKey,
        votePubkey: voteAccountPubkey
    }));
    let { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    transaction.partialSign(tempStakeAccount);
    let tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("Temporary stake account created and delegated with signature:", tx);
    // Merge the temporary stake account with the existing stake account
    transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.merge({
        stakePubkey: existingStakeAccountPubkey,
        sourceStakePubKey: tempStakeAccount.publicKey,
        authorizedPubkey: fromPublicKey
    }));
    blockhash = (await connection.getRecentBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;
    await (0, CubeSignerClient_1.signTransaction)(transaction, from);
    tx = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
    await connection.confirmTransaction(tx);
    console.log("Stake accounts merged with signature:", tx);
    return { txHash: tx, stakeAccountPubKey: tempStakeAccount.publicKey };
}
async function withdrawFromStakeAccounts(connection, stakeAccounts, payerKey) {
    const payerPublicKey = new web3_js_1.PublicKey(payerKey.materialId);
    for (const accountPubkey of stakeAccounts) {
        const stakePubkey = new web3_js_1.PublicKey(accountPubkey);
        const accountInfo = await connection.getParsedAccountInfo(stakePubkey);
        if (accountInfo.value !== null && accountInfo.value.data.program === 'stake') {
            const lamports = accountInfo.value.data.parsed.info.stake?.delegation?.stake;
            const transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.withdraw({
                stakePubkey: stakePubkey,
                authorizedPubkey: payerPublicKey,
                toPubkey: payerPublicKey,
                lamports: lamports,
            }));
            transaction.feePayer = payerPublicKey;
            const blockhash = (await connection.getRecentBlockhash()).blockhash;
            transaction.recentBlockhash = blockhash;
            await (0, CubeSignerClient_1.signTransaction)(transaction, payerKey);
            try {
                const tx = await connection.sendRawTransaction(transaction.serialize());
                await (0, dbFunctions_1.createWithdrawTransaction)(accountPubkey, tx);
                await (0, dbFunctions_1.removeStakeAccount)(accountPubkey);
                console.log(`Withdrawn ${lamports} lamports from ${accountPubkey}, transaction signature: ${tx}`);
            }
            catch (error) {
                console.error(`Failed to withdraw from ${accountPubkey}:`, error);
            }
        }
        else {
            console.log(`No stake account found or invalid account for pubkey: ${accountPubkey}`);
        }
    }
}
async function mergeStakeAccounts(connection, stakeAccounts, payerKey) {
    const payerPublicKey = new web3_js_1.PublicKey(payerKey.materialId);
    let mergedStakeAccounts = [];
    let remainingStakeAccounts = [];
    while (stakeAccounts.length > 0) {
        const baseAccount = stakeAccounts.shift();
        const basePubkey = new web3_js_1.PublicKey(baseAccount);
        let canMerge = false;
        for (let i = 0; i < stakeAccounts.length; i++) {
            const targetAccount = stakeAccounts[i];
            const targetPubkey = new web3_js_1.PublicKey(targetAccount);
            // Check if the stake accounts can be merged
            const baseAccountInfo = await connection.getParsedAccountInfo(basePubkey);
            const targetAccountInfo = await connection.getParsedAccountInfo(targetPubkey);
            const baseWithdrawAuthority = (baseAccountInfo?.value?.data).parsed.info.meta.authorized.withdrawer;
            const targetWithdrawAuthority = (targetAccountInfo?.value?.data).parsed.info.meta.authorized.withdrawer;
            const baseLockup = (baseAccountInfo?.value?.data).parsed.info.meta.lockup;
            const targetLockup = (targetAccountInfo?.value?.data).parsed.info.meta.lockup;
            if (baseWithdrawAuthority === targetWithdrawAuthority &&
                baseLockup.custodian === targetLockup.custodian &&
                baseLockup.epoch === targetLockup.epoch &&
                baseLockup.unixTimestamp === targetLockup.unixTimestamp) {
                // Merge stake accounts
                const transaction = new web3_js_1.Transaction().add(web3_js_1.StakeProgram.merge({
                    stakePubkey: new web3_js_1.PublicKey(baseAccount),
                    sourceStakePubKey: targetPubkey,
                    authorizedPubkey: new web3_js_1.PublicKey(baseWithdrawAuthority)
                }));
                transaction.feePayer = payerPublicKey;
                const blockhash = (await connection.getRecentBlockhash()).blockhash;
                transaction.recentBlockhash = blockhash;
                await (0, CubeSignerClient_1.signTransaction)(transaction, payerKey);
                const signature = await connection.sendRawTransaction(transaction.serialize());
                console.log(`Merged ${targetAccount} into ${baseAccount}, transaction signature: ${signature}`);
                await (0, dbFunctions_1.insertMergeStakeAccountsTransaction)(targetAccount, baseAccount, signature);
                await (0, dbFunctions_1.mergeDbStakeAccounts)(targetAccount, baseAccount);
                // Remove the merged account from the list
                stakeAccounts.splice(i, 1);
                canMerge = true;
                break;
            }
        }
        if (canMerge) {
            mergedStakeAccounts.push(baseAccount);
        }
        else {
            remainingStakeAccounts.push(baseAccount);
        }
    }
    return { mergedStakeAccounts, remainingStakeAccounts };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sYW5hU3Rha2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzb2xhbmFTdGFrZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQThCQSxzQ0F3SEM7QUFFRCw0QkE4Q0M7QUF1SUQsOERBb0NDO0FBRUQsZ0RBNkRDO0FBL2FELHlDQUF3RjtBQUN4RixtREFPMkI7QUFDM0IsNkNBVXlCO0FBQ3pCLGlFQUF3RTtBQUN4RSx1REFBaUg7QUFHakgsTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUdLLEtBQUssVUFBVSxhQUFhLENBQ2pDLE1BQWMsRUFDZCxtQkFBMkIsRUFDM0IscUJBQTZCLEVBQzdCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsU0FBaUIsRUFDakIsWUFBb0IsRUFDcEIsU0FBaUIsRUFDakIsbUJBQTJCLEVBQzNCLHlCQUFpQztJQUVqQyxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDeEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQzVFLE9BQU8sQ0FBQyxHQUFHLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3QkFBd0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUM5QyxPQUFPLENBQUMsR0FBRyxDQUFDLDJCQUEyQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQ3BELE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDMUQsT0FBTyxDQUFDLEdBQUcsQ0FBQywyQkFBMkIsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUNwRCxPQUFPLENBQUMsR0FBRyxDQUFDLHFDQUFxQyxFQUFFLG1CQUFtQixDQUFDLENBQUM7SUFDeEUsT0FBTyxDQUFDLEdBQUcs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O2dCQUN2RCwwQ0FBMEM7Z0JBQzFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMzQixRQUFRLEdBQUcsSUFBSSxDQUFDO2dCQUNoQixNQUFNO1lBQ1IsQ0FBQztRQUNILENBQUM7UUFFRCxJQUFJLFFBQVEsRUFBRSxDQUFDO1lBQ2IsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7YUFBTSxDQUFDO1lBQ04sc0JBQXNCLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNDLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxFQUFFLG1CQUFtQixFQUFFLHNCQUFzQixFQUFFLENBQUM7QUFDekQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IFN0YWtlQWNjb3VudFN0YXR1cywgU3Rha2VUeXBlLCB0ZW5hbnQsIFRyYW5zYWN0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHtcbiAgY3JlYXRlV2l0aGRyYXdUcmFuc2FjdGlvbixcbiAgZ2V0Q3ViaXN0Q29uZmlnLFxuICBnZXRGaXJzdFdhbGxldCwgZ2V0VG9rZW4sIGdldFdhbGxldCxcbiAgaW5zZXJ0TWVyZ2VTdGFrZUFjY291bnRzVHJhbnNhY3Rpb24sXG4gIGluc2VydFN0YWtlQWNjb3VudCxcbiAgaW5zZXJ0U3Rha2luZ1RyYW5zYWN0aW9uLCBtZXJnZURiU3Rha2VBY2NvdW50cywgcmVtb3ZlU3Rha2VBY2NvdW50LFxufSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7XG4gIENvbm5lY3Rpb24sXG4gIExBTVBPUlRTX1BFUl9TT0wsXG4gIFB1YmxpY0tleSxcbiAgU3Rha2VQcm9ncmFtLFxuICBLZXlwYWlyLFxuICBBdXRob3JpemVkLFxuICBUcmFuc2FjdGlvbixcbiAgTG9ja3VwLFxuICB0eXBlIFNpZ25lciwgc2VuZEFuZENvbmZpcm1UcmFuc2FjdGlvblxufSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgeyBvaWRjTG9naW4sIHNpZ25UcmFuc2FjdGlvbiB9IGZyb20gXCIuLi9jdWJpc3QvQ3ViZVNpZ25lckNsaWVudFwiO1xuaW1wb3J0IHsgZ2V0U29sQmFsYW5jZSwgZ2V0U29sQ29ubmVjdGlvbiwgZ2V0U3BsVG9rZW5CYWxhbmNlLCB2ZXJpZnlTb2xhbmFUcmFuc2FjdGlvbiB9IGZyb20gXCIuL3NvbGFuYUZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgS2V5IH0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuXG5jb25zdCBlbnY6IGFueSA9IHtcbiAgU2lnbmVyQXBpUm9vdDogcHJvY2Vzcy5lbnZbXCJDU19BUElfUk9PVFwiXSA/PyBcImh0dHBzOi8vZ2FtbWEuc2lnbmVyLmN1YmlzdC5kZXZcIlxufTtcblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc29sYW5hU3Rha2luZyhcbiAgdGVuYW50OiB0ZW5hbnQsXG4gIHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzOiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBzeW1ib2w6IHN0cmluZyxcbiAgb2lkY1Rva2VuOiBzdHJpbmcsXG4gIHRlbmFudFVzZXJJZDogc3RyaW5nLFxuICBjaGFpblR5cGU6IHN0cmluZyxcbiAgdGVuYW50VHJhbnNhY3Rpb25JZDogc3RyaW5nLFxuICBsb2NrdXBFeHBpcmF0aW9uVGltZXN0YW1wOiBudW1iZXJcbikge1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXXNlbmRlcldhbGxldEFkZHJlc3M6XCIsIHNlbmRlcldhbGxldEFkZHJlc3MpO1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXXJlY2VpdmVyV2FsbGV0QWRkcmVzczpcIiwgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzKTtcbiAgY29uc29sZS5sb2coXCJbc29sYW5hU3Rha2luZ11hbW91bnQ6XCIsIGFtb3VudCk7XG4gIGNvbnNvbGUubG9nKFwiW3NvbGFuYVN0YWtpbmddc3ltYm9sOlwiLCBzeW1ib2wpO1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXW9pZGNUb2tlbjpcIiwgb2lkY1Rva2VuKTtcbiAgY29uc29sZS5sb2coXCJbc29sYW5hU3Rha2luZ110ZW5hbnRVc2VySWQ6XCIsIHRlbmFudFVzZXJJZCk7XG4gIGNvbnNvbGUubG9nKFwiW3NvbGFuYVN0YWtpbmddY2hhaW5UeXBlOlwiLCBjaGFpblR5cGUpO1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXXRlbmFudFRyYW5zYWN0aW9uSWQ6XCIsIHRlbmFudFRyYW5zYWN0aW9uSWQpO1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXWxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXA6XCIsIGxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXApO1xuXG4gIC8vIDEuIENoZWNrIGlmIG9pZGNUb2tlbiBleGlzdHMsIGlmIG5vdCByZXR1cm4gZXJyb3JcbiAgaWYgKCFvaWRjVG9rZW4pXG4gICAgcmV0dXJuIHtcbiAgICAgIHdhbGxldDogbnVsbCxcbiAgICAgIGVycm9yOiBcIlBsZWFzZSBwcm92aWRlIGFuIGlkZW50aXR5IHRva2VuIGZvciB2ZXJpZmljYXRpb25cIlxuICAgIH07XG4gIC8vIDIuIEdldCBDdWJpc3QgQ29uZmlndXJhdGlvbiwgaWYgbm90IGZvdW5kIHJldHVybiBlcnJvclxuICBjb25zdCBjdWJpc3RDb25maWcgPSBhd2FpdCBnZXRDdWJpc3RDb25maWcodGVuYW50LmlkKTtcbiAgaWYgKGN1YmlzdENvbmZpZyA9PSBudWxsKVxuICAgIHJldHVybiB7XG4gICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbiAgICAgIGVycm9yOiBcIkN1YmlzdCBDb25maWd1cmF0aW9uIG5vdCBmb3VuZCBmb3IgdGhlIGdpdmVuIHRlbmFudFwiXG4gICAgfTtcbiAgLy8gMy4gR2V0IGZpcnN0IHdhbGxldCBieSB3YWxsZXQgYWRkcmVzcywgaWYgbm90IGZvdW5kIHJldHVybiBlcnJvclxuICBjb25zdCB3YWxsZXQgPSBhd2FpdCBnZXRXYWxsZXQoc2VuZGVyV2FsbGV0QWRkcmVzcyk7XG4gIGlmICghd2FsbGV0KSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgZXJyb3I6IFwiV2FsbGV0IG5vdCBmb3VuZCBmb3IgdGhlIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgICB9O1xuICB9XG4gIC8vIDQuIENoZWNrIHRoZSBTeW1ib2wsIGlmIFNPTCB0aGVuIHN0YWtlIFNPTCwgaWYgbm90IHRoZW4gcmV0dXJuIGVycm9yXG4gIGlmIChzeW1ib2wgIT09IFwiU09MXCIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHJhbnNhY3Rpb246IG51bGwsXG4gICAgICBlcnJvcjogXCJTeW1ib2wgbm90IFN1cHBvcnRlZFwiXG4gICAgfTtcbiAgfVxuICAvLyA1LiBDaGVjayBjdXN0b21lciBJRCwgaWYgbm90IGZvdW5kIHJldHVybiBlcnJvclxuICBpZiAoIXdhbGxldC5jdXN0b21lcmlkKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuICAgICAgZXJyb3I6IFwiQ3VzdG9tZXIgSUQgbm90IGZvdW5kXCJcbiAgICB9O1xuICB9XG5cbiAgLy8gNi4gR2V0IGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgaWYgYmFsYW5jZSBpcyBsZXNzIHRoYW4gYW1vdW50IHJldHVybiBlcnJvclxuICBjb25zdCBiYWxhbmNlID0gYXdhaXQgZ2V0U29sQmFsYW5jZShzZW5kZXJXYWxsZXRBZGRyZXNzKTtcbiAgaWYgKGJhbGFuY2UgPCBhbW91bnQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHJhbnNhY3Rpb246IG51bGwsXG4gICAgICBlcnJvcjogXCJJbnN1ZmZpY2llbnQgU09MIGJhbGFuY2VcIlxuICAgIH07XG4gIH1cblxuICAvLyA3LiBTdGFrZSBTT0xcbiAgY29uc3QgdHggPSBhd2FpdCBzdGFrZVNvbChzZW5kZXJXYWxsZXRBZGRyZXNzLCBhbW91bnQsIHJlY2VpdmVyV2FsbGV0QWRkcmVzcywgb2lkY1Rva2VuLCBsb2NrdXBFeHBpcmF0aW9uVGltZXN0YW1wLCBjdWJpc3RDb25maWcub3JnaWQpO1xuICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXXR4OlwiLCB0eCk7XG4gIC8vIDguIENoZWNrIGlmIHRyYW5zYWN0aW9uIGlzIHN1Y2Nlc3NmdWwsIGlmIG5vdCByZXR1cm4gZXJyb3JcbiAgaWYgKHR4LmVycm9yKSB7XG4gICAgY29uc29sZS5sb2coXCJbc29sYW5hU3Rha2luZ110eC5lcnJvcjpcIiwgdHguZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbiAgICAgIGVycm9yOiB0eC5lcnJvclxuICAgIH07XG4gIH1cblxuICAvLyA5LiBWZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFuZCBpbnNlcnQgdGhlIHN0YWtlIGFjY291bnQgYW5kIHN0YWtpbmcgdHJhbnNhY3Rpb25cbiAgY29uc3QgdHJhbnNhY3Rpb25TdGF0dXMgPSBhd2FpdCB2ZXJpZnlTb2xhbmFUcmFuc2FjdGlvbih0eD8udHJ4SGFzaCEpO1xuICBjb25zdCB0eFN0YXR1cyA9IHRyYW5zYWN0aW9uU3RhdHVzID09PSBcImZpbmFsaXplZFwiID8gVHJhbnNhY3Rpb25TdGF0dXMuU1VDQ0VTUyA6IFRyYW5zYWN0aW9uU3RhdHVzLlBFTkRJTkc7XG4gIGNvbnN0IHN0YWtlQWNjb3VudFN0YXR1cyA9IFN0YWtlQWNjb3VudFN0YXR1cy5PUEVOO1xuXG4gIGNvbnN0IG5ld1N0YWtlQWNjb3VudCA9IGF3YWl0IGluc2VydFN0YWtlQWNjb3VudChcbiAgICBzZW5kZXJXYWxsZXRBZGRyZXNzLFxuICAgIHJlY2VpdmVyV2FsbGV0QWRkcmVzcyxcbiAgICBhbW91bnQsXG4gICAgY2hhaW5UeXBlLFxuICAgIHN5bWJvbCxcbiAgICB0ZW5hbnQuaWQsXG4gICAgd2FsbGV0LmN1c3RvbWVyaWQsXG4gICAgdGVuYW50VXNlcklkLFxuICAgIHByb2Nlc3MuZW52W1wiU09MQU5BX05FVFdPUktcIl0gPz8gXCJcIixcbiAgICBzdGFrZUFjY291bnRTdGF0dXMsXG4gICAgdGVuYW50VHJhbnNhY3Rpb25JZCxcbiAgICB0eD8uc3Rha2VBY2NvdW50UHViS2V5Py50b1N0cmluZygpIHx8IFwiXCIsXG4gICAgbG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcFxuICApO1xuICBjb25zdCB0b2tlbj1hd2FpdCBnZXRUb2tlbihzeW1ib2wpXG4gIGNvbnN0IHRyYW5zYWN0aW9uID0gYXdhaXQgaW5zZXJ0U3Rha2luZ1RyYW5zYWN0aW9uKFxuICAgIHNlbmRlcldhbGxldEFkZHJlc3MsXG4gICAgcmVjZWl2ZXJXYWxsZXRBZGRyZXNzLFxuICAgIGFtb3VudCxcbiAgICBjaGFpblR5cGUsXG4gICAgc3ltYm9sLFxuICAgIHR4Py50cnhIYXNoIHx8IFwiXCIsXG4gICAgdGVuYW50LmlkLFxuICAgIHdhbGxldC5jdXN0b21lcmlkLFxuICAgIHRva2VuPy5pZCBhcyBzdHJpbmcsXG4gICAgdGVuYW50VXNlcklkLFxuICAgIHByb2Nlc3MuZW52W1wiU09MQU5BX05FVFdPUktcIl0gPz8gXCJcIixcbiAgICB0eFN0YXR1cyxcbiAgICB0ZW5hbnRUcmFuc2FjdGlvbklkLFxuICAgIHR4Py5zdGFrZUFjY291bnRQdWJLZXk/LnRvU3RyaW5nKCkgfHwgXCJcIixcbiAgICBuZXdTdGFrZUFjY291bnQuaWQsXG4gICAgU3Rha2VUeXBlLlNUQUtFXG4gICk7XG4gIGNvbnNvbGUubG9nKFwiW3NvbGFuYVN0YWtpbmdddHJhbnNhY3Rpb246XCIsIHRyYW5zYWN0aW9uKTtcbiAgcmV0dXJuIHsgdHJhbnNhY3Rpb24sIGVycm9yOiBudWxsIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFrZVNvbChcbiAgc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBhbW91bnQ6IG51bWJlcixcbiAgdmFsaWRhdG9yTm9kZUtleTogc3RyaW5nLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgbG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcDogbnVtYmVyLFxuICBjdWJpc3RPcmdJZDogc3RyaW5nXG4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgZ2V0U29sQ29ubmVjdGlvbigpO1xuICAgIGNvbnN0IHZhbGlkYXRvckFkZHJlc3MgPSBuZXcgUHVibGljS2V5KHZhbGlkYXRvck5vZGVLZXkpO1xuICAgIGNvbnN0IGFtb3VudFRvU3Rha2UgPSBwYXJzZUZsb2F0KGFtb3VudC50b1N0cmluZygpKTtcbiAgICBjb25zdCBvaWRjQ2xpZW50ID0gYXdhaXQgb2lkY0xvZ2luKGVudiwgY3ViaXN0T3JnSWQsIG9pZGNUb2tlbiwgW1wic2lnbjoqXCJdKTtcbiAgICBpZiAoIW9pZGNDbGllbnQpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHRyeEhhc2g6IG51bGwsXG4gICAgICAgIHN0YWtlQWNjb3VudFB1YktleTogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgdmVyaWZpY2F0aW9uXCJcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IGtleXMgPSBhd2FpdCBvaWRjQ2xpZW50LnNlc3Npb25LZXlzKCk7XG4gICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0cnhIYXNoOiBudWxsLFxuICAgICAgICBlcnJvcjogXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHNlbmRlcktleSA9IGtleXMuZmlsdGVyKChrZXk6IGNzLktleSkgPT4ga2V5Lm1hdGVyaWFsSWQgPT09IHNlbmRlcldhbGxldEFkZHJlc3MpO1xuICAgIGlmIChzZW5kZXJLZXkubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0cnhIYXNoOiBudWxsLFxuICAgICAgICBlcnJvcjogXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgICAgIH07XG4gICAgfVxuICAgIGNvbnN0IHN0YWtldHJhbnNhY3Rpb24gPSBhd2FpdCBjcmVhdGVTdGFrZUFjY291bnRXaXRoU3Rha2VQcm9ncmFtKFxuICAgICAgY29ubmVjdGlvbixcbiAgICAgIHNlbmRlcktleVswXSxcbiAgICAgIGFtb3VudFRvU3Rha2UsXG4gICAgICB2YWxpZGF0b3JBZGRyZXNzLFxuICAgICAgbG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcFxuICAgICk7XG4gICAgcmV0dXJuIHsgdHJ4SGFzaDogc3Rha2V0cmFuc2FjdGlvbi50eEhhc2gsIHN0YWtlQWNjb3VudFB1YktleTogc3Rha2V0cmFuc2FjdGlvbi5zdGFrZUFjY291bnRQdWJLZXksIGVycm9yOiBudWxsIH07XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgY29uc29sZS5sb2coYXdhaXQgZXJyKTtcbiAgICByZXR1cm4geyB0cnhIYXNoOiBudWxsLCBlcnJvcjogZXJyIH07XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gY3JlYXRlU3Rha2VBY2NvdW50V2l0aFN0YWtlUHJvZ3JhbShcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgZnJvbTogS2V5LFxuICBhbW91bnQ6IG51bWJlcixcbiAgdmFsaWRhdG9yUHVia2V5OiBQdWJsaWNLZXksXG4gIGxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXA6IG51bWJlclxuKSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3Rha2VBY2NvdW50ID0gS2V5cGFpci5nZW5lcmF0ZSgpO1xuICAgIGNvbnNvbGUubG9nKFwiW2NyZWF0ZVN0YWtlQWNjb3VudFdpdGhTdGFrZVByb2dyYW1dc3Rha2VBY2NvdW50OlwiLCBzdGFrZUFjY291bnQucHVibGljS2V5LnRvQmFzZTU4KCkpO1xuXG4gICAgY29uc3QgbGFtcG9ydHMgPSBhbW91bnQgKiBMQU1QT1JUU19QRVJfU09MO1xuICAgIGNvbnN0IGZyb21QdWJsaWNLZXkgPSBuZXcgUHVibGljS2V5KGZyb20ubWF0ZXJpYWxJZCk7XG5cbiAgICBjb25zdCBhdXRob3JpemVkID0gbmV3IEF1dGhvcml6ZWQoZnJvbVB1YmxpY0tleSwgZnJvbVB1YmxpY0tleSk7XG5cbiAgICBjb25zdCB0cmFuc2FjdGlvbiA9IG5ldyBUcmFuc2FjdGlvbigpLmFkZChcbiAgICAgIFN0YWtlUHJvZ3JhbS5jcmVhdGVBY2NvdW50KHtcbiAgICAgICAgZnJvbVB1YmtleTogZnJvbVB1YmxpY0tleSxcbiAgICAgICAgc3Rha2VQdWJrZXk6IHN0YWtlQWNjb3VudC5wdWJsaWNLZXksXG4gICAgICAgIGF1dGhvcml6ZWQsXG4gICAgICAgIGxhbXBvcnRzLFxuICAgICAgICBsb2NrdXA6IG5ldyBMb2NrdXAobG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcCwgMCwgZnJvbVB1YmxpY0tleSlcbiAgICAgIH0pLFxuXG4gICAgICBTdGFrZVByb2dyYW0uZGVsZWdhdGUoe1xuICAgICAgICBzdGFrZVB1YmtleTogc3Rha2VBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgICAgYXV0aG9yaXplZFB1YmtleTogZnJvbVB1YmxpY0tleSxcbiAgICAgICAgdm90ZVB1YmtleTogdmFsaWRhdG9yUHVia2V5XG4gICAgICB9KVxuICAgICk7XG5cbiAgICBjb25zdCB7IGJsb2NraGFzaCB9ID0gYXdhaXQgY29ubmVjdGlvbi5nZXRSZWNlbnRCbG9ja2hhc2goKTtcbiAgICB0cmFuc2FjdGlvbi5yZWNlbnRCbG9ja2hhc2ggPSBibG9ja2hhc2g7XG4gICAgdHJhbnNhY3Rpb24uZmVlUGF5ZXIgPSBmcm9tUHVibGljS2V5O1xuXG4gICAgYXdhaXQgc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBmcm9tKTtcbiAgICB0cmFuc2FjdGlvbi5wYXJ0aWFsU2lnbihzdGFrZUFjY291bnQpO1xuXG4gICAgY29uc3QgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gICAgY29uc29sZS5sb2coXCJbY3JlYXRlU3Rha2VBY2NvdW50V2l0aFN0YWtlUHJvZ3JhbV10eDpcIiwgdHgpO1xuXG4gICAgcmV0dXJuIHsgdHhIYXNoOiB0eCwgc3Rha2VBY2NvdW50UHViS2V5OiBzdGFrZUFjY291bnQucHVibGljS2V5IH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKGBbY3JlYXRlU3Rha2VBY2NvdW50V2l0aFN0YWtlUHJvZ3JhbV1lcnI6JHtlcnJ9YCk7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRXJyb3IgY3JlYXRpbmcgc3Rha2UgYWNjb3VudCB3aXRoIFN0YWtlUHJvZ3JhbVwiKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRMb2NrdXBEZXRhaWxzKGNvbm5lY3Rpb246IENvbm5lY3Rpb24sIHN0YWtlQWNjb3VudFB1YmtleTogUHVibGljS2V5KSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc3Rha2VBY2NvdW50SW5mbyA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0UGFyc2VkQWNjb3VudEluZm8oc3Rha2VBY2NvdW50UHVia2V5KTtcbiAgICBjb25zdCBzdGFrZUFjY291bnREYXRhID0gc3Rha2VBY2NvdW50SW5mby52YWx1ZT8uZGF0YTtcblxuICAgIGlmICghc3Rha2VBY2NvdW50RGF0YSB8fCAhKFwicGFyc2VkXCIgaW4gc3Rha2VBY2NvdW50RGF0YSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkZhaWxlZCB0byBwYXJzZSBzdGFrZSBhY2NvdW50IGRhdGFcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgc3Rha2VBY2NvdW50ID0gKHN0YWtlQWNjb3VudERhdGEgYXMgYW55KS5wYXJzZWQuaW5mbztcbiAgICBjb25zdCBsb2NrdXAgPSBzdGFrZUFjY291bnQubWV0YS5sb2NrdXA7XG5cbiAgICByZXR1cm4gbmV3IExvY2t1cChsb2NrdXAudW5peFRpbWVzdGFtcCwgbG9ja3VwLmVwb2NoLCBuZXcgUHVibGljS2V5KGxvY2t1cC5jdXN0b2RpYW4pKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHRocm93IG5ldyBFcnJvcihcIkVycm9yIHJldHJpZXZpbmcgbG9ja3VwIGRldGFpbHNcIik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gYWRkU3Rha2VUb0V4aXN0aW5nQWNjb3VudChcbiAgY29ubmVjdGlvbjogQ29ubmVjdGlvbixcbiAgZnJvbTogS2V5LFxuICBleGlzdGluZ1N0YWtlQWNjb3VudFB1YmtleTogUHVibGljS2V5LFxuICB2b3RlQWNjb3VudFB1YmtleTogUHVibGljS2V5LFxuICBhbW91bnQ6IG51bWJlclxuKSB7XG4gIGNvbnN0IGZyb21QdWJsaWNLZXkgPSBuZXcgUHVibGljS2V5KGZyb20ubWF0ZXJpYWxJZCk7XG4gIGNvbnN0IHRlbXBTdGFrZUFjY291bnQgPSBLZXlwYWlyLmdlbmVyYXRlKCk7XG4gIGNvbnN0IGxhbXBvcnRzRm9yU3Rha2UgPSBhbW91bnQgKiBMQU1QT1JUU19QRVJfU09MO1xuICBjb25zdCBsYW1wb3J0c0ZvclJlbnRFeGVtcHRpb24gPSBhd2FpdCBjb25uZWN0aW9uLmdldE1pbmltdW1CYWxhbmNlRm9yUmVudEV4ZW1wdGlvbihTdGFrZVByb2dyYW0uc3BhY2UpO1xuICBjb25zdCB0b3RhbExhbXBvcnRzID0gbGFtcG9ydHNGb3JTdGFrZSArIGxhbXBvcnRzRm9yUmVudEV4ZW1wdGlvbjtcbiAgY29uc3QgbG9ja3VwRGV0YWlscyA9IGF3YWl0IGdldExvY2t1cERldGFpbHMoY29ubmVjdGlvbiwgZXhpc3RpbmdTdGFrZUFjY291bnRQdWJrZXkpO1xuXG4gIGNvbnN0IGF1dGhvcml6ZWQgPSBuZXcgQXV0aG9yaXplZChmcm9tUHVibGljS2V5LCBmcm9tUHVibGljS2V5KTtcblxuICAvLyBDcmVhdGUgYW5kIGRlbGVnYXRlIHRoZSB0ZW1wb3Jhcnkgc3Rha2UgYWNjb3VudFxuICBsZXQgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgU3Rha2VQcm9ncmFtLmNyZWF0ZUFjY291bnQoe1xuICAgICAgZnJvbVB1YmtleTogZnJvbVB1YmxpY0tleSxcbiAgICAgIHN0YWtlUHVia2V5OiB0ZW1wU3Rha2VBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgIGF1dGhvcml6ZWQsXG4gICAgICBsYW1wb3J0czogdG90YWxMYW1wb3J0cyxcbiAgICAgIGxvY2t1cDogbG9ja3VwRGV0YWlsc1xuICAgIH0pLFxuICAgIFN0YWtlUHJvZ3JhbS5kZWxlZ2F0ZSh7XG4gICAgICBzdGFrZVB1YmtleTogdGVtcFN0YWtlQWNjb3VudC5wdWJsaWNLZXksXG4gICAgICBhdXRob3JpemVkUHVia2V5OiBmcm9tUHVibGljS2V5LFxuICAgICAgdm90ZVB1YmtleTogdm90ZUFjY291bnRQdWJrZXlcbiAgICB9KVxuICApO1xuXG4gIGxldCB7IGJsb2NraGFzaCB9ID0gYXdhaXQgY29ubmVjdGlvbi5nZXRSZWNlbnRCbG9ja2hhc2goKTtcbiAgdHJhbnNhY3Rpb24ucmVjZW50QmxvY2toYXNoID0gYmxvY2toYXNoO1xuICB0cmFuc2FjdGlvbi5mZWVQYXllciA9IGZyb21QdWJsaWNLZXk7XG5cbiAgYXdhaXQgc2lnblRyYW5zYWN0aW9uKHRyYW5zYWN0aW9uLCBmcm9tKTtcbiAgdHJhbnNhY3Rpb24ucGFydGlhbFNpZ24odGVtcFN0YWtlQWNjb3VudCk7XG5cbiAgbGV0IHR4ID0gYXdhaXQgY29ubmVjdGlvbi5zZW5kUmF3VHJhbnNhY3Rpb24odHJhbnNhY3Rpb24uc2VyaWFsaXplKCkpO1xuICBhd2FpdCBjb25uZWN0aW9uLmNvbmZpcm1UcmFuc2FjdGlvbih0eCk7XG4gIGNvbnNvbGUubG9nKFwiVGVtcG9yYXJ5IHN0YWtlIGFjY291bnQgY3JlYXRlZCBhbmQgZGVsZWdhdGVkIHdpdGggc2lnbmF0dXJlOlwiLCB0eCk7XG5cbiAgLy8gTWVyZ2UgdGhlIHRlbXBvcmFyeSBzdGFrZSBhY2NvdW50IHdpdGggdGhlIGV4aXN0aW5nIHN0YWtlIGFjY291bnRcbiAgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgU3Rha2VQcm9ncmFtLm1lcmdlKHtcbiAgICAgIHN0YWtlUHVia2V5OiBleGlzdGluZ1N0YWtlQWNjb3VudFB1YmtleSxcbiAgICAgIHNvdXJjZVN0YWtlUHViS2V5OiB0ZW1wU3Rha2VBY2NvdW50LnB1YmxpY0tleSxcbiAgICAgIGF1dGhvcml6ZWRQdWJrZXk6IGZyb21QdWJsaWNLZXlcbiAgICB9KVxuICApO1xuXG4gIGJsb2NraGFzaCA9IChhd2FpdCBjb25uZWN0aW9uLmdldFJlY2VudEJsb2NraGFzaCgpKS5ibG9ja2hhc2g7XG4gIHRyYW5zYWN0aW9uLnJlY2VudEJsb2NraGFzaCA9IGJsb2NraGFzaDtcbiAgdHJhbnNhY3Rpb24uZmVlUGF5ZXIgPSBmcm9tUHVibGljS2V5O1xuXG4gIGF3YWl0IHNpZ25UcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgZnJvbSk7XG5cbiAgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSwgeyBza2lwUHJlZmxpZ2h0OiB0cnVlIH0pO1xuICBhd2FpdCBjb25uZWN0aW9uLmNvbmZpcm1UcmFuc2FjdGlvbih0eCk7XG4gIGNvbnNvbGUubG9nKFwiU3Rha2UgYWNjb3VudHMgbWVyZ2VkIHdpdGggc2lnbmF0dXJlOlwiLCB0eCk7XG4gIHJldHVybiB7IHR4SGFzaDogdHgsIHN0YWtlQWNjb3VudFB1YktleTogdGVtcFN0YWtlQWNjb3VudC5wdWJsaWNLZXkgfTtcbn1cblxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2l0aGRyYXdGcm9tU3Rha2VBY2NvdW50cyhjb25uZWN0aW9uOiBDb25uZWN0aW9uLHN0YWtlQWNjb3VudHM6IGFueSwgcGF5ZXJLZXk6IEtleSkge1xuICBjb25zdCBwYXllclB1YmxpY0tleSA9IG5ldyBQdWJsaWNLZXkocGF5ZXJLZXkubWF0ZXJpYWxJZCk7XG4gIGZvciAoY29uc3QgYWNjb3VudFB1YmtleSBvZiBzdGFrZUFjY291bnRzKSB7XG4gICAgY29uc3Qgc3Rha2VQdWJrZXkgPSBuZXcgUHVibGljS2V5KGFjY291bnRQdWJrZXkpO1xuICAgIGNvbnN0IGFjY291bnRJbmZvID0gYXdhaXQgY29ubmVjdGlvbi5nZXRQYXJzZWRBY2NvdW50SW5mbyhzdGFrZVB1YmtleSk7XG5cbiAgICBpZiAoYWNjb3VudEluZm8udmFsdWUgIT09IG51bGwgJiYgKGFjY291bnRJbmZvLnZhbHVlLmRhdGEgYXMgYW55KS5wcm9ncmFtID09PSAnc3Rha2UnKSB7XG4gICAgICBjb25zdCBsYW1wb3J0cyA9IChhY2NvdW50SW5mby52YWx1ZS5kYXRhIGFzIGFueSkucGFyc2VkLmluZm8uc3Rha2U/LmRlbGVnYXRpb24/LnN0YWtlO1xuXG5cbiAgICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gbmV3IFRyYW5zYWN0aW9uKCkuYWRkKFxuICAgICAgICBTdGFrZVByb2dyYW0ud2l0aGRyYXcoe1xuICAgICAgICAgIHN0YWtlUHVia2V5OiBzdGFrZVB1YmtleSxcbiAgICAgICAgICBhdXRob3JpemVkUHVia2V5OiBwYXllclB1YmxpY0tleSxcbiAgICAgICAgICB0b1B1YmtleTogcGF5ZXJQdWJsaWNLZXksXG4gICAgICAgICAgbGFtcG9ydHM6IGxhbXBvcnRzLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgdHJhbnNhY3Rpb24uZmVlUGF5ZXIgPSBwYXllclB1YmxpY0tleTtcbiAgICAgIGNvbnN0IGJsb2NraGFzaCA9IChhd2FpdCBjb25uZWN0aW9uLmdldFJlY2VudEJsb2NraGFzaCgpKS5ibG9ja2hhc2g7XG4gICAgICB0cmFuc2FjdGlvbi5yZWNlbnRCbG9ja2hhc2ggPSBibG9ja2hhc2g7XG5cbiAgICAgIGF3YWl0IHNpZ25UcmFuc2FjdGlvbih0cmFuc2FjdGlvbiwgcGF5ZXJLZXkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdHggPSBhd2FpdCBjb25uZWN0aW9uLnNlbmRSYXdUcmFuc2FjdGlvbih0cmFuc2FjdGlvbi5zZXJpYWxpemUoKSk7XG4gICAgICAgIGF3YWl0IGNyZWF0ZVdpdGhkcmF3VHJhbnNhY3Rpb24oYWNjb3VudFB1YmtleSwgdHgpO1xuICAgICAgICBhd2FpdCByZW1vdmVTdGFrZUFjY291bnQoYWNjb3VudFB1YmtleSk7XG4gICAgICAgIGNvbnNvbGUubG9nKGBXaXRoZHJhd24gJHtsYW1wb3J0c30gbGFtcG9ydHMgZnJvbSAke2FjY291bnRQdWJrZXl9LCB0cmFuc2FjdGlvbiBzaWduYXR1cmU6ICR7dHh9YCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKGBGYWlsZWQgdG8gd2l0aGRyYXcgZnJvbSAke2FjY291bnRQdWJrZXl9OmAsIGVycm9yKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS5sb2coYE5vIHN0YWtlIGFjY291bnQgZm91bmQgb3IgaW52YWxpZCBhY2NvdW50IGZvciBwdWJrZXk6ICR7YWNjb3VudFB1YmtleX1gKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1lcmdlU3Rha2VBY2NvdW50cyhjb25uZWN0aW9uOiBDb25uZWN0aW9uLHN0YWtlQWNjb3VudHM6c3RyaW5nW10sIHBheWVyS2V5OktleSkge1xuICBjb25zdCBwYXllclB1YmxpY0tleSA9IG5ldyBQdWJsaWNLZXkocGF5ZXJLZXkubWF0ZXJpYWxJZCk7XG4gIGxldCBtZXJnZWRTdGFrZUFjY291bnRzID0gW107XG4gIGxldCByZW1haW5pbmdTdGFrZUFjY291bnRzID0gW107XG5cbiAgd2hpbGUgKHN0YWtlQWNjb3VudHMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGJhc2VBY2NvdW50ID0gc3Rha2VBY2NvdW50cy5zaGlmdCgpIGFzIHN0cmluZztcbiAgICBjb25zdCBiYXNlUHVia2V5ID0gbmV3IFB1YmxpY0tleShiYXNlQWNjb3VudCk7XG4gICAgbGV0IGNhbk1lcmdlID0gZmFsc2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN0YWtlQWNjb3VudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHRhcmdldEFjY291bnQgPSBzdGFrZUFjY291bnRzW2ldO1xuICAgICAgY29uc3QgdGFyZ2V0UHVia2V5ID0gbmV3IFB1YmxpY0tleSh0YXJnZXRBY2NvdW50KTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHN0YWtlIGFjY291bnRzIGNhbiBiZSBtZXJnZWRcbiAgICAgIGNvbnN0IGJhc2VBY2NvdW50SW5mbyA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0UGFyc2VkQWNjb3VudEluZm8oYmFzZVB1YmtleSk7XG4gICAgICBjb25zdCB0YXJnZXRBY2NvdW50SW5mbyA9IGF3YWl0IGNvbm5lY3Rpb24uZ2V0UGFyc2VkQWNjb3VudEluZm8odGFyZ2V0UHVia2V5KTtcblxuICAgICAgY29uc3QgYmFzZVdpdGhkcmF3QXV0aG9yaXR5ID0gKGJhc2VBY2NvdW50SW5mbz8udmFsdWU/LmRhdGEgYXMgYW55KS5wYXJzZWQuaW5mby5tZXRhLmF1dGhvcml6ZWQud2l0aGRyYXdlcjtcbiAgICAgIGNvbnN0IHRhcmdldFdpdGhkcmF3QXV0aG9yaXR5ID0gKHRhcmdldEFjY291bnRJbmZvPy52YWx1ZT8uZGF0YSBhcyBhbnkpLnBhcnNlZC5pbmZvLm1ldGEuYXV0aG9yaXplZC53aXRoZHJhd2VyO1xuICAgICAgY29uc3QgYmFzZUxvY2t1cCA9IChiYXNlQWNjb3VudEluZm8/LnZhbHVlPy5kYXRhIGFzIGFueSkucGFyc2VkLmluZm8ubWV0YS5sb2NrdXA7XG4gICAgICBjb25zdCB0YXJnZXRMb2NrdXAgPSAodGFyZ2V0QWNjb3VudEluZm8/LnZhbHVlPy5kYXRhIGFzIGFueSkucGFyc2VkLmluZm8ubWV0YS5sb2NrdXA7XG5cbiAgICAgIGlmIChiYXNlV2l0aGRyYXdBdXRob3JpdHkgPT09IHRhcmdldFdpdGhkcmF3QXV0aG9yaXR5ICYmXG4gICAgICAgIGJhc2VMb2NrdXAuY3VzdG9kaWFuID09PSB0YXJnZXRMb2NrdXAuY3VzdG9kaWFuICYmXG4gICAgICAgIGJhc2VMb2NrdXAuZXBvY2ggPT09IHRhcmdldExvY2t1cC5lcG9jaCAmJlxuICAgICAgICBiYXNlTG9ja3VwLnVuaXhUaW1lc3RhbXAgPT09IHRhcmdldExvY2t1cC51bml4VGltZXN0YW1wKSB7XG5cbiAgICAgICAgLy8gTWVyZ2Ugc3Rha2UgYWNjb3VudHNcbiAgICAgICAgY29uc3QgdHJhbnNhY3Rpb24gPSBuZXcgVHJhbnNhY3Rpb24oKS5hZGQoXG4gICAgICAgICAgU3Rha2VQcm9ncmFtLm1lcmdlKHtcbiAgICAgICAgICAgIHN0YWtlUHVia2V5OiBuZXcgUHVibGljS2V5KGJhc2VBY2NvdW50KSxcbiAgICAgICAgICAgIHNvdXJjZVN0YWtlUHViS2V5OiB0YXJnZXRQdWJrZXksXG4gICAgICAgICAgICBhdXRob3JpemVkUHVia2V5OiBuZXcgUHVibGljS2V5KGJhc2VXaXRoZHJhd0F1dGhvcml0eSlcbiAgICAgICAgICB9KVxuICAgICAgICApO1xuXG4gICAgICAgIHRyYW5zYWN0aW9uLmZlZVBheWVyID0gcGF5ZXJQdWJsaWNLZXk7XG4gICAgICAgIGNvbnN0IGJsb2NraGFzaCA9IChhd2FpdCBjb25uZWN0aW9uLmdldFJlY2VudEJsb2NraGFzaCgpKS5ibG9ja2hhc2g7XG4gICAgICAgIHRyYW5zYWN0aW9uLnJlY2VudEJsb2NraGFzaCA9IGJsb2NraGFzaDtcblxuICAgICAgICBhd2FpdCBzaWduVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24sIHBheWVyS2V5KTtcbiAgICAgICAgY29uc3Qgc2lnbmF0dXJlID0gYXdhaXQgY29ubmVjdGlvbi5zZW5kUmF3VHJhbnNhY3Rpb24odHJhbnNhY3Rpb24uc2VyaWFsaXplKCkpO1xuICAgICAgICBjb25zb2xlLmxvZyhgTWVyZ2VkICR7dGFyZ2V0QWNjb3VudH0gaW50byAke2Jhc2VBY2NvdW50fSwgdHJhbnNhY3Rpb24gc2lnbmF0dXJlOiAke3NpZ25hdHVyZX1gKTtcbiAgICAgICAgYXdhaXQgaW5zZXJ0TWVyZ2VTdGFrZUFjY291bnRzVHJhbnNhY3Rpb24odGFyZ2V0QWNjb3VudCxiYXNlQWNjb3VudCwgc2lnbmF0dXJlKTtcbiAgICAgICAgYXdhaXQgbWVyZ2VEYlN0YWtlQWNjb3VudHModGFyZ2V0QWNjb3VudCwgYmFzZUFjY291bnQpO1xuICAgICAgICAvLyBSZW1vdmUgdGhlIG1lcmdlZCBhY2NvdW50IGZyb20gdGhlIGxpc3RcbiAgICAgICAgc3Rha2VBY2NvdW50cy5zcGxpY2UoaSwgMSk7XG4gICAgICAgIGNhbk1lcmdlID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhbk1lcmdlKSB7XG4gICAgICBtZXJnZWRTdGFrZUFjY291bnRzLnB1c2goYmFzZUFjY291bnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW1haW5pbmdTdGFrZUFjY291bnRzLnB1c2goYmFzZUFjY291bnQpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB7IG1lcmdlZFN0YWtlQWNjb3VudHMsIHJlbWFpbmluZ1N0YWtlQWNjb3VudHMgfTtcbn0iXX0=