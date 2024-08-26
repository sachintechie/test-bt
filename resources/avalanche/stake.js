"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stakeAvax = stakeAvax;
const env = {
    SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
// export async function staking(
//   tenant: tenant,
//   senderWalletAddress: string,
//   receiverWalletAddress: string,
//   amount: number,
//   symbol: string,
//   oidcToken: string,
//   tenantUserId: string,
//   chainType: string,
//   tenantTransactionId: string,
//   lockupExpirationTimestamp: number
// ) {
//   // 1. Check if oidcToken exists, if not return error
//   if (!oidcToken)
//     return {
//       wallet: null,
//       error: "Please send a valid identity token for verification"
//     };
//   // 2. Get Cubist Configuration, if not found return error
//   const cubistConfig = await getCubistConfig(tenant.id);
//   if (cubistConfig == null)
//     return {
//       transaction: null,
//       error: "Cubist Configuration not found for the given tenant"
//     };
//   // 3. Get first wallet by wallet address, if not found return error
//   const wallet = await getFirstWallet(senderWalletAddress, tenant, symbol);
//   if (!wallet) {
//     return {
//       transaction: null,
//       error: "Wallet not found for the given wallet address"
//     };
//   }
//   // 4. Check the Symbol, if SOL then stake SOL, if not then return error
//   if (symbol !== "SOL") {
//     return {
//       transaction: null,
//       error: "Symbol not Supported"
//     };
//   }
//   // 5. Check customer ID, if not found return error
//   if (!wallet.customerid) {
//     return {
//       transaction: null,
//       error: "Customer ID not found"
//     };
//   }
//   // 6. Get balance of the wallet, if balance is less than amount return error
//   const balance = await getAvaxBalance(senderWalletAddress);
//   if ( balance != null && balance < amount) {
//     return {
//       transaction: null,
//       error: "Insufficient AVAX balance"
//     };
//   }
//   // 7. Stake SOL
//   const tx = await stakeAvax(senderWalletAddress, amount, receiverWalletAddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid);
//   console.log("[solanaStaking]tx:", tx);
//   // 8. Check if transaction is successful, if not return error
//   if (tx.error) {
//     console.log("[solanaStaking]tx.error:", tx.error);
//     return {
//       transaction: null,
//       error: tx.error
//     };
//   }
//   // 9. Verify the transaction and insert the stake account and staking transaction
//   const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
//   const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
//   const stakeAccountStatus = StakeAccountStatus.OPEN;
//   const newStakeAccount = await insertStakeAccount(
//     senderWalletAddress,
//     receiverWalletAddress,
//     amount,
//     chainType,
//     symbol,
//     tenant.id,
//     wallet.customerid,
//     tenantUserId,
//     process.env["SOLANA_NETWORK"] ?? "",
//     stakeAccountStatus,
//     tenantTransactionId,
//     tx?.stakeAccountPubKey?.toString() || "",
//     lockupExpirationTimestamp
//   );
//   const transaction = await insertStakingTransaction(
//     senderWalletAddress,
//     receiverWalletAddress,
//     amount,
//     chainType,
//     symbol,
//     tx?.trxHash || "",
//     tenant.id,
//     wallet.customerid,
//     wallet.tokenid,
//     tenantUserId,
//     process.env["SOLANA_NETWORK"] ?? "",
//     txStatus,
//     tenantTransactionId,
//     tx?.stakeAccountPubKey?.toString() || "",
//     newStakeAccount.stakeaccountid,
//     StakeType.STAKE
//   );
//   console.log("[solanaStaking]transaction:", transaction);
//   return { transaction, error: null };
// }
async function stakeAvax(senderWalletAddress, amount, validatorNodeKey, oidcToken, lockupExpirationTimestamp, cubistOrgId) {
    // try {
    //   const { xchain, pchain } = await getAvaxConnection();
    //   const validatorAddress = new PublicKey(validatorNodeKey);
    //   const amountToStake = parseFloat(amount.toString());
    //   const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    //   if (!oidcClient) {
    //     return {
    //       trxHash: null,
    //       stakeAccountPubKey: null,
    //       error: "Please send a valid identity token for verification"
    //     };
    //   }
    //   const keys = await oidcClient.sessionKeys();
    //   if (keys.length === 0) {
    //     return {
    //       trxHash: null,
    //       error: "Given identity token is not the owner of given wallet address"
    //     };
    //   }
    //   const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);
    //   if (senderKey.length === 0) {
    //     return {
    //       trxHash: null,
    //       error: "Given identity token is not the owner of given wallet address"
    //     };
    //   }
    //   const staketransaction = await createStakeAccountWithStakeProgram(
    //     pchain,
    //     senderKey[0],
    //     amountToStake,
    //     validatorAddress,
    //     lockupExpirationTimestamp
    //   );
    //   return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };
    // } catch (err: any) {
    //   console.log(await err);
    //   return { trxHash: null, error: err };
    // }
    return { trxHash: null, stakeAccountPubKey: "null", error: "err" };
}
// export async function createStakeAccountWithStakeProgram(
//   pchain: PlatformVMAPI,
//   senderKey: Key,
//   amount: number,
//   lockupExpirationTimestamp: number
// ) {
//   const stakeAmount: number = amount; // Amount to stake in nAVAX (1 AVAX = 10^9 nAVAX)
// const startTime: number = UnixNow() + 60; // Start staking in 60 seconds
// const endTime: number = UnixNow() + 60 * 60 * 24 * 30; // End staking in 30 days
// const nodeID: string = "NodeID-..."; // Node ID to delegate to
// const pKeychain: KeyChain = pchain.keyChain();
// const pAddressStrings: string[] = pKeychain.getAddressStrings();
// const avaxAssetID: string = Defaults.network[networkID].X.avaxAssetID;
// const utxoSet: UTXOSet = await pchain.getUTXOs(pAddressStrings);
// const stakeTx: Tx = await pchain.buildAddDelegatorTx(
//   utxoSet,
//   pAddressStrings,
//   pAddressStrings,
//   pAddressStrings,
//   stakeAmount,
//   startTime,
//   endTime,
//   nodeID
// );
// const signedTx: Tx = stakeTx.sign(pKeychain);
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Rha2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdGFrZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQTBJQSw4QkFpREM7QUExS0QsTUFBTSxHQUFHLEdBQVE7SUFDZixhQUFhLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsSUFBSSxpQ0FBaUM7Q0FDL0UsQ0FBQztBQUtGLGlDQUFpQztBQUNqQyxvQkFBb0I7QUFDcEIsaUNBQWlDO0FBQ2pDLG1DQUFtQztBQUNuQyxvQkFBb0I7QUFDcEIsb0JBQW9CO0FBQ3BCLHVCQUF1QjtBQUN2QiwwQkFBMEI7QUFDMUIsdUJBQXVCO0FBQ3ZCLGlDQUFpQztBQUNqQyxzQ0FBc0M7QUFDdEMsTUFBTTtBQUdOLHlEQUF5RDtBQUN6RCxvQkFBb0I7QUFDcEIsZUFBZTtBQUNmLHNCQUFzQjtBQUN0QixxRUFBcUU7QUFDckUsU0FBUztBQUNULDhEQUE4RDtBQUM5RCwyREFBMkQ7QUFDM0QsOEJBQThCO0FBQzlCLGVBQWU7QUFDZiwyQkFBMkI7QUFDM0IscUVBQXFFO0FBQ3JFLFNBQVM7QUFDVCx3RUFBd0U7QUFDeEUsOEVBQThFO0FBQzlFLG1CQUFtQjtBQUNuQixlQUFlO0FBQ2YsMkJBQTJCO0FBQzNCLCtEQUErRDtBQUMvRCxTQUFTO0FBQ1QsTUFBTTtBQUVOLDRFQUE0RTtBQUM1RSw0QkFBNEI7QUFDNUIsZUFBZTtBQUNmLDJCQUEyQjtBQUMzQixzQ0FBc0M7QUFDdEMsU0FBUztBQUNULE1BQU07QUFDTix1REFBdUQ7QUFDdkQsOEJBQThCO0FBQzlCLGVBQWU7QUFDZiwyQkFBMkI7QUFDM0IsdUNBQXVDO0FBQ3ZDLFNBQVM7QUFDVCxNQUFNO0FBRU4saUZBQWlGO0FBQ2pGLCtEQUErRDtBQUMvRCxnREFBZ0Q7QUFDaEQsZUFBZTtBQUNmLDJCQUEyQjtBQUMzQiwyQ0FBMkM7QUFDM0MsU0FBUztBQUNULE1BQU07QUFFTixvQkFBb0I7QUFDcEIsOElBQThJO0FBQzlJLDJDQUEyQztBQUMzQyxrRUFBa0U7QUFDbEUsb0JBQW9CO0FBQ3BCLHlEQUF5RDtBQUN6RCxlQUFlO0FBQ2YsMkJBQTJCO0FBQzNCLHdCQUF3QjtBQUN4QixTQUFTO0FBQ1QsTUFBTTtBQUVOLHNGQUFzRjtBQUN0Riw4RUFBOEU7QUFDOUUsZ0hBQWdIO0FBQ2hILHdEQUF3RDtBQUV4RCxzREFBc0Q7QUFDdEQsMkJBQTJCO0FBQzNCLDZCQUE2QjtBQUM3QixjQUFjO0FBQ2QsaUJBQWlCO0FBQ2pCLGNBQWM7QUFDZCxpQkFBaUI7QUFDakIseUJBQXlCO0FBQ3pCLG9CQUFvQjtBQUNwQiwyQ0FBMkM7QUFDM0MsMEJBQTBCO0FBQzFCLDJCQUEyQjtBQUMzQixnREFBZ0Q7QUFDaEQsZ0NBQWdDO0FBQ2hDLE9BQU87QUFDUCx3REFBd0Q7QUFDeEQsMkJBQTJCO0FBQzNCLDZCQUE2QjtBQUM3QixjQUFjO0FBQ2QsaUJBQWlCO0FBQ2pCLGNBQWM7QUFDZCx5QkFBeUI7QUFDekIsaUJBQWlCO0FBQ2pCLHlCQUF5QjtBQUN6QixzQkFBc0I7QUFDdEIsb0JBQW9CO0FBQ3BCLDJDQUEyQztBQUMzQyxnQkFBZ0I7QUFDaEIsMkJBQTJCO0FBQzNCLGdEQUFnRDtBQUNoRCxzQ0FBc0M7QUFDdEMsc0JBQXNCO0FBQ3RCLE9BQU87QUFDUCw2REFBNkQ7QUFDN0QseUNBQXlDO0FBQ3pDLElBQUk7QUFFRyxLQUFLLFVBQVUsU0FBUyxDQUM3QixtQkFBMkIsRUFDM0IsTUFBYyxFQUNkLGdCQUF3QixFQUN4QixTQUFpQixFQUNqQix5QkFBaUMsRUFDakMsV0FBbUI7SUFFbkIsUUFBUTtJQUNSLDBEQUEwRDtJQUMxRCw4REFBOEQ7SUFDOUQseURBQXlEO0lBQ3pELGlGQUFpRjtJQUNqRix1QkFBdUI7SUFDdkIsZUFBZTtJQUNmLHVCQUF1QjtJQUN2QixrQ0FBa0M7SUFDbEMscUVBQXFFO0lBQ3JFLFNBQVM7SUFDVCxNQUFNO0lBQ04saURBQWlEO0lBQ2pELDZCQUE2QjtJQUM3QixlQUFlO0lBQ2YsdUJBQXVCO0lBQ3ZCLCtFQUErRTtJQUMvRSxTQUFTO0lBQ1QsTUFBTTtJQUNOLDRGQUE0RjtJQUM1RixrQ0FBa0M7SUFDbEMsZUFBZTtJQUNmLHVCQUF1QjtJQUN2QiwrRUFBK0U7SUFDL0UsU0FBUztJQUNULE1BQU07SUFDTix1RUFBdUU7SUFDdkUsY0FBYztJQUNkLG9CQUFvQjtJQUNwQixxQkFBcUI7SUFDckIsd0JBQXdCO0lBQ3hCLGdDQUFnQztJQUNoQyxPQUFPO0lBQ1AsdUhBQXVIO0lBQ3ZILHVCQUF1QjtJQUN2Qiw0QkFBNEI7SUFDNUIsMENBQTBDO0lBQzFDLElBQUk7SUFFQSxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxrQkFBa0IsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDO0FBRXhFLENBQUM7QUFHRCw0REFBNEQ7QUFDNUQsMkJBQTJCO0FBQzNCLG9CQUFvQjtBQUNwQixvQkFBb0I7QUFDcEIsc0NBQXNDO0FBQ3RDLE1BQU07QUFHTiwwRkFBMEY7QUFDMUYsMkVBQTJFO0FBQzNFLG1GQUFtRjtBQUNuRixpRUFBaUU7QUFDakUsaURBQWlEO0FBQ2pELG1FQUFtRTtBQUNuRSx5RUFBeUU7QUFFekUsbUVBQW1FO0FBQ25FLHdEQUF3RDtBQUN4RCxhQUFhO0FBQ2IscUJBQXFCO0FBQ3JCLHFCQUFxQjtBQUNyQixxQkFBcUI7QUFDckIsaUJBQWlCO0FBQ2pCLGVBQWU7QUFDZixhQUFhO0FBQ2IsV0FBVztBQUNYLEtBQUs7QUFFTCxnREFBZ0Q7QUFDaEQsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IFN0YWtlQWNjb3VudFN0YXR1cywgU3Rha2VUeXBlLCB0ZW5hbnQsIFRyYW5zYWN0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHtcbiAgZ2V0Q3ViaXN0Q29uZmlnLFxuICBnZXRGaXJzdFdhbGxldCxcbiAgaW5zZXJ0U3Rha2VBY2NvdW50LFxuICBpbnNlcnRTdGFraW5nVHJhbnNhY3Rpb25cbiAgXG59IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgQXZhbGFuY2hlLCBCaW5Ub29scywgQnVmZmVyIH0gZnJvbSBcImF2YWxhbmNoZVwiO1xuaW1wb3J0IHsgQVZNQVBJLCBLZXlDaGFpbiBhcyBBVk1LZXlDaGFpbiwgS2V5Q2hhaW4sIFR4IH0gZnJvbSBcImF2YWxhbmNoZS9kaXN0L2FwaXMvYXZtXCI7XG5pbXBvcnQgeyBEZWZhdWx0cywgVW5peE5vdyB9IGZyb20gXCJhdmFsYW5jaGUvZGlzdC91dGlsc1wiO1xuaW1wb3J0IHsgb2lkY0xvZ2luLCBzaWduVHJhbnNhY3Rpb24gfSBmcm9tIFwiLi4vY3ViaXN0L0N1YmVTaWduZXJDbGllbnRcIjtcbmltcG9ydCB7IEtleSB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IFBsYXRmb3JtVk1BUEkgfSBmcm9tIFwiYXZhbGFuY2hlL2Rpc3QvYXBpcy9wbGF0Zm9ybXZtXCI7XG5pbXBvcnQgeyBnZXRBdmF4QmFsYW5jZSwgdmVyaWZ5QXZhbGFuY2hlVHJhbnNhY3Rpb24gfSBmcm9tIFwiLi9jb21tb25GdW5jdGlvbnNcIjtcblxuY29uc3QgZW52OiBhbnkgPSB7XG4gIFNpZ25lckFwaVJvb3Q6IHByb2Nlc3MuZW52W1wiQ1NfQVBJX1JPT1RcIl0gPz8gXCJodHRwczovL2dhbW1hLnNpZ25lci5jdWJpc3QuZGV2XCJcbn07XG5cblxuXG5cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiBzdGFraW5nKFxuLy8gICB0ZW5hbnQ6IHRlbmFudCxcbi8vICAgc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuLy8gICByZWNlaXZlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbi8vICAgYW1vdW50OiBudW1iZXIsXG4vLyAgIHN5bWJvbDogc3RyaW5nLFxuLy8gICBvaWRjVG9rZW46IHN0cmluZyxcbi8vICAgdGVuYW50VXNlcklkOiBzdHJpbmcsXG4vLyAgIGNoYWluVHlwZTogc3RyaW5nLFxuLy8gICB0ZW5hbnRUcmFuc2FjdGlvbklkOiBzdHJpbmcsXG4vLyAgIGxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXA6IG51bWJlclxuLy8gKSB7XG4gIFxuXG4vLyAgIC8vIDEuIENoZWNrIGlmIG9pZGNUb2tlbiBleGlzdHMsIGlmIG5vdCByZXR1cm4gZXJyb3Jcbi8vICAgaWYgKCFvaWRjVG9rZW4pXG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgIHdhbGxldDogbnVsbCxcbi8vICAgICAgIGVycm9yOiBcIlBsZWFzZSBzZW5kIGEgdmFsaWQgaWRlbnRpdHkgdG9rZW4gZm9yIHZlcmlmaWNhdGlvblwiXG4vLyAgICAgfTtcbi8vICAgLy8gMi4gR2V0IEN1YmlzdCBDb25maWd1cmF0aW9uLCBpZiBub3QgZm91bmQgcmV0dXJuIGVycm9yXG4vLyAgIGNvbnN0IGN1YmlzdENvbmZpZyA9IGF3YWl0IGdldEN1YmlzdENvbmZpZyh0ZW5hbnQuaWQpO1xuLy8gICBpZiAoY3ViaXN0Q29uZmlnID09IG51bGwpXG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuLy8gICAgICAgZXJyb3I6IFwiQ3ViaXN0IENvbmZpZ3VyYXRpb24gbm90IGZvdW5kIGZvciB0aGUgZ2l2ZW4gdGVuYW50XCJcbi8vICAgICB9O1xuLy8gICAvLyAzLiBHZXQgZmlyc3Qgd2FsbGV0IGJ5IHdhbGxldCBhZGRyZXNzLCBpZiBub3QgZm91bmQgcmV0dXJuIGVycm9yXG4vLyAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IGdldEZpcnN0V2FsbGV0KHNlbmRlcldhbGxldEFkZHJlc3MsIHRlbmFudCwgc3ltYm9sKTtcbi8vICAgaWYgKCF3YWxsZXQpIHtcbi8vICAgICByZXR1cm4ge1xuLy8gICAgICAgdHJhbnNhY3Rpb246IG51bGwsXG4vLyAgICAgICBlcnJvcjogXCJXYWxsZXQgbm90IGZvdW5kIGZvciB0aGUgZ2l2ZW4gd2FsbGV0IGFkZHJlc3NcIlxuLy8gICAgIH07XG4vLyAgIH1cblxuLy8gICAvLyA0LiBDaGVjayB0aGUgU3ltYm9sLCBpZiBTT0wgdGhlbiBzdGFrZSBTT0wsIGlmIG5vdCB0aGVuIHJldHVybiBlcnJvclxuLy8gICBpZiAoc3ltYm9sICE9PSBcIlNPTFwiKSB7XG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuLy8gICAgICAgZXJyb3I6IFwiU3ltYm9sIG5vdCBTdXBwb3J0ZWRcIlxuLy8gICAgIH07XG4vLyAgIH1cbi8vICAgLy8gNS4gQ2hlY2sgY3VzdG9tZXIgSUQsIGlmIG5vdCBmb3VuZCByZXR1cm4gZXJyb3Jcbi8vICAgaWYgKCF3YWxsZXQuY3VzdG9tZXJpZCkge1xuLy8gICAgIHJldHVybiB7XG4vLyAgICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbi8vICAgICAgIGVycm9yOiBcIkN1c3RvbWVyIElEIG5vdCBmb3VuZFwiXG4vLyAgICAgfTtcbi8vICAgfVxuXG4vLyAgIC8vIDYuIEdldCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGlmIGJhbGFuY2UgaXMgbGVzcyB0aGFuIGFtb3VudCByZXR1cm4gZXJyb3Jcbi8vICAgY29uc3QgYmFsYW5jZSA9IGF3YWl0IGdldEF2YXhCYWxhbmNlKHNlbmRlcldhbGxldEFkZHJlc3MpO1xuLy8gICBpZiAoIGJhbGFuY2UgIT0gbnVsbCAmJiBiYWxhbmNlIDwgYW1vdW50KSB7XG4vLyAgICAgcmV0dXJuIHtcbi8vICAgICAgIHRyYW5zYWN0aW9uOiBudWxsLFxuLy8gICAgICAgZXJyb3I6IFwiSW5zdWZmaWNpZW50IEFWQVggYmFsYW5jZVwiXG4vLyAgICAgfTtcbi8vICAgfVxuXG4vLyAgIC8vIDcuIFN0YWtlIFNPTFxuLy8gICBjb25zdCB0eCA9IGF3YWl0IHN0YWtlQXZheChzZW5kZXJXYWxsZXRBZGRyZXNzLCBhbW91bnQsIHJlY2VpdmVyV2FsbGV0QWRkcmVzcywgb2lkY1Rva2VuLCBsb2NrdXBFeHBpcmF0aW9uVGltZXN0YW1wLCBjdWJpc3RDb25maWcub3JnaWQpO1xuLy8gICBjb25zb2xlLmxvZyhcIltzb2xhbmFTdGFraW5nXXR4OlwiLCB0eCk7XG4vLyAgIC8vIDguIENoZWNrIGlmIHRyYW5zYWN0aW9uIGlzIHN1Y2Nlc3NmdWwsIGlmIG5vdCByZXR1cm4gZXJyb3Jcbi8vICAgaWYgKHR4LmVycm9yKSB7XG4vLyAgICAgY29uc29sZS5sb2coXCJbc29sYW5hU3Rha2luZ110eC5lcnJvcjpcIiwgdHguZXJyb3IpO1xuLy8gICAgIHJldHVybiB7XG4vLyAgICAgICB0cmFuc2FjdGlvbjogbnVsbCxcbi8vICAgICAgIGVycm9yOiB0eC5lcnJvclxuLy8gICAgIH07XG4vLyAgIH1cblxuLy8gICAvLyA5LiBWZXJpZnkgdGhlIHRyYW5zYWN0aW9uIGFuZCBpbnNlcnQgdGhlIHN0YWtlIGFjY291bnQgYW5kIHN0YWtpbmcgdHJhbnNhY3Rpb25cbi8vICAgY29uc3QgdHJhbnNhY3Rpb25TdGF0dXMgPSBhd2FpdCB2ZXJpZnlBdmFsYW5jaGVUcmFuc2FjdGlvbih0eD8udHJ4SGFzaCEpO1xuLy8gICBjb25zdCB0eFN0YXR1cyA9IHRyYW5zYWN0aW9uU3RhdHVzID09PSBcImZpbmFsaXplZFwiID8gVHJhbnNhY3Rpb25TdGF0dXMuU1VDQ0VTUyA6IFRyYW5zYWN0aW9uU3RhdHVzLlBFTkRJTkc7XG4vLyAgIGNvbnN0IHN0YWtlQWNjb3VudFN0YXR1cyA9IFN0YWtlQWNjb3VudFN0YXR1cy5PUEVOO1xuXG4vLyAgIGNvbnN0IG5ld1N0YWtlQWNjb3VudCA9IGF3YWl0IGluc2VydFN0YWtlQWNjb3VudChcbi8vICAgICBzZW5kZXJXYWxsZXRBZGRyZXNzLFxuLy8gICAgIHJlY2VpdmVyV2FsbGV0QWRkcmVzcyxcbi8vICAgICBhbW91bnQsXG4vLyAgICAgY2hhaW5UeXBlLFxuLy8gICAgIHN5bWJvbCxcbi8vICAgICB0ZW5hbnQuaWQsXG4vLyAgICAgd2FsbGV0LmN1c3RvbWVyaWQsXG4vLyAgICAgdGVuYW50VXNlcklkLFxuLy8gICAgIHByb2Nlc3MuZW52W1wiU09MQU5BX05FVFdPUktcIl0gPz8gXCJcIixcbi8vICAgICBzdGFrZUFjY291bnRTdGF0dXMsXG4vLyAgICAgdGVuYW50VHJhbnNhY3Rpb25JZCxcbi8vICAgICB0eD8uc3Rha2VBY2NvdW50UHViS2V5Py50b1N0cmluZygpIHx8IFwiXCIsXG4vLyAgICAgbG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcFxuLy8gICApO1xuLy8gICBjb25zdCB0cmFuc2FjdGlvbiA9IGF3YWl0IGluc2VydFN0YWtpbmdUcmFuc2FjdGlvbihcbi8vICAgICBzZW5kZXJXYWxsZXRBZGRyZXNzLFxuLy8gICAgIHJlY2VpdmVyV2FsbGV0QWRkcmVzcyxcbi8vICAgICBhbW91bnQsXG4vLyAgICAgY2hhaW5UeXBlLFxuLy8gICAgIHN5bWJvbCxcbi8vICAgICB0eD8udHJ4SGFzaCB8fCBcIlwiLFxuLy8gICAgIHRlbmFudC5pZCxcbi8vICAgICB3YWxsZXQuY3VzdG9tZXJpZCxcbi8vICAgICB3YWxsZXQudG9rZW5pZCxcbi8vICAgICB0ZW5hbnRVc2VySWQsXG4vLyAgICAgcHJvY2Vzcy5lbnZbXCJTT0xBTkFfTkVUV09SS1wiXSA/PyBcIlwiLFxuLy8gICAgIHR4U3RhdHVzLFxuLy8gICAgIHRlbmFudFRyYW5zYWN0aW9uSWQsXG4vLyAgICAgdHg/LnN0YWtlQWNjb3VudFB1YktleT8udG9TdHJpbmcoKSB8fCBcIlwiLFxuLy8gICAgIG5ld1N0YWtlQWNjb3VudC5zdGFrZWFjY291bnRpZCxcbi8vICAgICBTdGFrZVR5cGUuU1RBS0Vcbi8vICAgKTtcbi8vICAgY29uc29sZS5sb2coXCJbc29sYW5hU3Rha2luZ110cmFuc2FjdGlvbjpcIiwgdHJhbnNhY3Rpb24pO1xuLy8gICByZXR1cm4geyB0cmFuc2FjdGlvbiwgZXJyb3I6IG51bGwgfTtcbi8vIH1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHN0YWtlQXZheChcbiAgc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICBhbW91bnQ6IG51bWJlcixcbiAgdmFsaWRhdG9yTm9kZUtleTogc3RyaW5nLFxuICBvaWRjVG9rZW46IHN0cmluZyxcbiAgbG9ja3VwRXhwaXJhdGlvblRpbWVzdGFtcDogbnVtYmVyLFxuICBjdWJpc3RPcmdJZDogc3RyaW5nXG4pIHtcbiAgLy8gdHJ5IHtcbiAgLy8gICBjb25zdCB7IHhjaGFpbiwgcGNoYWluIH0gPSBhd2FpdCBnZXRBdmF4Q29ubmVjdGlvbigpO1xuICAvLyAgIGNvbnN0IHZhbGlkYXRvckFkZHJlc3MgPSBuZXcgUHVibGljS2V5KHZhbGlkYXRvck5vZGVLZXkpO1xuICAvLyAgIGNvbnN0IGFtb3VudFRvU3Rha2UgPSBwYXJzZUZsb2F0KGFtb3VudC50b1N0cmluZygpKTtcbiAgLy8gICBjb25zdCBvaWRjQ2xpZW50ID0gYXdhaXQgb2lkY0xvZ2luKGVudiwgY3ViaXN0T3JnSWQsIG9pZGNUb2tlbiwgW1wic2lnbjoqXCJdKTtcbiAgLy8gICBpZiAoIW9pZGNDbGllbnQpIHtcbiAgLy8gICAgIHJldHVybiB7XG4gIC8vICAgICAgIHRyeEhhc2g6IG51bGwsXG4gIC8vICAgICAgIHN0YWtlQWNjb3VudFB1YktleTogbnVsbCxcbiAgLy8gICAgICAgZXJyb3I6IFwiUGxlYXNlIHNlbmQgYSB2YWxpZCBpZGVudGl0eSB0b2tlbiBmb3IgdmVyaWZpY2F0aW9uXCJcbiAgLy8gICAgIH07XG4gIC8vICAgfVxuICAvLyAgIGNvbnN0IGtleXMgPSBhd2FpdCBvaWRjQ2xpZW50LnNlc3Npb25LZXlzKCk7XG4gIC8vICAgaWYgKGtleXMubGVuZ3RoID09PSAwKSB7XG4gIC8vICAgICByZXR1cm4ge1xuICAvLyAgICAgICB0cnhIYXNoOiBudWxsLFxuICAvLyAgICAgICBlcnJvcjogXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgLy8gICAgIH07XG4gIC8vICAgfVxuICAvLyAgIGNvbnN0IHNlbmRlcktleSA9IGtleXMuZmlsdGVyKChrZXk6IGNzLktleSkgPT4ga2V5Lm1hdGVyaWFsSWQgPT09IHNlbmRlcldhbGxldEFkZHJlc3MpO1xuICAvLyAgIGlmIChzZW5kZXJLZXkubGVuZ3RoID09PSAwKSB7XG4gIC8vICAgICByZXR1cm4ge1xuICAvLyAgICAgICB0cnhIYXNoOiBudWxsLFxuICAvLyAgICAgICBlcnJvcjogXCJHaXZlbiBpZGVudGl0eSB0b2tlbiBpcyBub3QgdGhlIG93bmVyIG9mIGdpdmVuIHdhbGxldCBhZGRyZXNzXCJcbiAgLy8gICAgIH07XG4gIC8vICAgfVxuICAvLyAgIGNvbnN0IHN0YWtldHJhbnNhY3Rpb24gPSBhd2FpdCBjcmVhdGVTdGFrZUFjY291bnRXaXRoU3Rha2VQcm9ncmFtKFxuICAvLyAgICAgcGNoYWluLFxuICAvLyAgICAgc2VuZGVyS2V5WzBdLFxuICAvLyAgICAgYW1vdW50VG9TdGFrZSxcbiAgLy8gICAgIHZhbGlkYXRvckFkZHJlc3MsXG4gIC8vICAgICBsb2NrdXBFeHBpcmF0aW9uVGltZXN0YW1wXG4gIC8vICAgKTtcbiAgLy8gICByZXR1cm4geyB0cnhIYXNoOiBzdGFrZXRyYW5zYWN0aW9uLnR4SGFzaCwgc3Rha2VBY2NvdW50UHViS2V5OiBzdGFrZXRyYW5zYWN0aW9uLnN0YWtlQWNjb3VudFB1YktleSwgZXJyb3I6IG51bGwgfTtcbiAgLy8gfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgLy8gICBjb25zb2xlLmxvZyhhd2FpdCBlcnIpO1xuICAvLyAgIHJldHVybiB7IHRyeEhhc2g6IG51bGwsIGVycm9yOiBlcnIgfTtcbiAgLy8gfVxuXG4gICAgICByZXR1cm4geyB0cnhIYXNoOiBudWxsLHN0YWtlQWNjb3VudFB1YktleTogXCJudWxsXCIsIGVycm9yOiBcImVyclwiIH07XG5cbn1cblxuXG4vLyBleHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlU3Rha2VBY2NvdW50V2l0aFN0YWtlUHJvZ3JhbShcbi8vICAgcGNoYWluOiBQbGF0Zm9ybVZNQVBJLFxuLy8gICBzZW5kZXJLZXk6IEtleSxcbi8vICAgYW1vdW50OiBudW1iZXIsXG4vLyAgIGxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXA6IG51bWJlclxuLy8gKSB7XG5cblxuLy8gICBjb25zdCBzdGFrZUFtb3VudDogbnVtYmVyID0gYW1vdW50OyAvLyBBbW91bnQgdG8gc3Rha2UgaW4gbkFWQVggKDEgQVZBWCA9IDEwXjkgbkFWQVgpXG4vLyBjb25zdCBzdGFydFRpbWU6IG51bWJlciA9IFVuaXhOb3coKSArIDYwOyAvLyBTdGFydCBzdGFraW5nIGluIDYwIHNlY29uZHNcbi8vIGNvbnN0IGVuZFRpbWU6IG51bWJlciA9IFVuaXhOb3coKSArIDYwICogNjAgKiAyNCAqIDMwOyAvLyBFbmQgc3Rha2luZyBpbiAzMCBkYXlzXG4vLyBjb25zdCBub2RlSUQ6IHN0cmluZyA9IFwiTm9kZUlELS4uLlwiOyAvLyBOb2RlIElEIHRvIGRlbGVnYXRlIHRvXG4vLyBjb25zdCBwS2V5Y2hhaW46IEtleUNoYWluID0gcGNoYWluLmtleUNoYWluKCk7XG4vLyBjb25zdCBwQWRkcmVzc1N0cmluZ3M6IHN0cmluZ1tdID0gcEtleWNoYWluLmdldEFkZHJlc3NTdHJpbmdzKCk7XG4vLyBjb25zdCBhdmF4QXNzZXRJRDogc3RyaW5nID0gRGVmYXVsdHMubmV0d29ya1tuZXR3b3JrSURdLlguYXZheEFzc2V0SUQ7XG5cbi8vIGNvbnN0IHV0eG9TZXQ6IFVUWE9TZXQgPSBhd2FpdCBwY2hhaW4uZ2V0VVRYT3MocEFkZHJlc3NTdHJpbmdzKTtcbi8vIGNvbnN0IHN0YWtlVHg6IFR4ID0gYXdhaXQgcGNoYWluLmJ1aWxkQWRkRGVsZWdhdG9yVHgoXG4vLyAgIHV0eG9TZXQsXG4vLyAgIHBBZGRyZXNzU3RyaW5ncyxcbi8vICAgcEFkZHJlc3NTdHJpbmdzLFxuLy8gICBwQWRkcmVzc1N0cmluZ3MsXG4vLyAgIHN0YWtlQW1vdW50LFxuLy8gICBzdGFydFRpbWUsXG4vLyAgIGVuZFRpbWUsXG4vLyAgIG5vZGVJRFxuLy8gKTtcblxuLy8gY29uc3Qgc2lnbmVkVHg6IFR4ID0gc3Rha2VUeC5zaWduKHBLZXljaGFpbik7XG4vLyB9XG5cblxuXG4iXX0=