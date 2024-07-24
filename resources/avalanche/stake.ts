import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import {
  getCubistConfig,
  getFirstWallet,
  insertStakeAccount,
  insertStakingTransaction
  
} from "../db/dbFunctions";
import { Avalanche, BinTools, Buffer } from "avalanche";
import { AVMAPI, KeyChain as AVMKeyChain, KeyChain, Tx } from "avalanche/dist/apis/avm";
import { Defaults, UnixNow } from "avalanche/dist/utils";
import { oidcLogin, signTransaction } from "../cubist/CubeSignerClient";
import { Key } from "@cubist-labs/cubesigner-sdk";
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm";
import { getAvaxBalance, verifyAvalancheTransaction } from "./commonFunctions";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};




export async function staking(
  tenant: tenant,
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string,
  lockupExpirationTimestamp: number
) {
  

  // 1. Check if oidcToken exists, if not return error
  if (!oidcToken)
    return {
      wallet: null,
      error: "Please send a valid identity token for verification"
    };
  // 2. Get Cubist Configuration, if not found return error
  const cubistConfig = await getCubistConfig(tenant.id);
  if (cubistConfig == null)
    return {
      transaction: null,
      error: "Cubist Configuration not found for the given tenant"
    };
  // 3. Get first wallet by wallet address, if not found return error
  const wallet = await getFirstWallet(senderWalletAddress, tenant, symbol);
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
  const balance = await getAvaxBalance(senderWalletAddress);
  if ( balance != null && balance < amount) {
    return {
      transaction: null,
      error: "Insufficient AVAX balance"
    };
  }

  // 7. Stake SOL
  const tx = await stakeAvax(senderWalletAddress, amount, receiverWalletAddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid);
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
  const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
  const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
  const stakeAccountStatus = StakeAccountStatus.OPEN;

  const newStakeAccount = await insertStakeAccount(
    senderWalletAddress,
    receiverWalletAddress,
    amount,
    chainType,
    symbol,
    tenant.id,
    wallet.customerid,
    tenantUserId,
    process.env["SOLANA_NETWORK"] ?? "",
    stakeAccountStatus,
    tenantTransactionId,
    tx?.stakeAccountPubKey?.toString() || "",
    lockupExpirationTimestamp
  );
  const transaction = await insertStakingTransaction(
    senderWalletAddress,
    receiverWalletAddress,
    amount,
    chainType,
    symbol,
    tx?.trxHash || "",
    tenant.id,
    wallet.customerid,
    wallet.tokenid,
    tenantUserId,
    process.env["SOLANA_NETWORK"] ?? "",
    txStatus,
    tenantTransactionId,
    tx?.stakeAccountPubKey?.toString() || "",
    newStakeAccount.stakeaccountid,
    StakeType.STAKE
  );
  console.log("[solanaStaking]transaction:", transaction);
  return { transaction, error: null };
}

export async function stakeAvax(
  senderWalletAddress: string,
  amount: number,
  validatorNodeKey: string,
  oidcToken: string,
  lockupExpirationTimestamp: number,
  cubistOrgId: string
) {
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

      return { trxHash: null,stakeAccountPubKey: "null", error: "err" };

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



