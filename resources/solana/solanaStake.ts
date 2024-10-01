import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import {
  createWithdrawTransaction,
  getCubistConfig,
  getStakeAccounData,
  getToken,
  getWallet,
  insertMergeStakeAccountsTransaction,
  insertStakeAccount,
  insertStakingTransaction,
  mergeDbStakeAccounts,
  updateStakeAccount
} from "../db/dbFunctions";
import { Connection, LAMPORTS_PER_SOL, PublicKey, StakeProgram, Keypair, Authorized, Transaction, Lockup } from "@solana/web3.js";
import { oidcLogin, signTransaction } from "../cubist/CubeSignerClient";
import { getSolBalance, getSolConnection, getStakeAccountInfo, verifySolanaTransaction } from "./solanaFunctions";
import { Key } from "@cubist-labs/cubesigner-sdk";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function solanaStaking(
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
  console.log("[solanaStaking]senderWalletAddress:", senderWalletAddress);
  console.log("[solanaStaking]receiverWalletAddress:", receiverWalletAddress);
  console.log("[solanaStaking]amount:", amount);
  console.log("[solanaStaking]symbol:", symbol);
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
  const cubistConfig = await getCubistConfig(tenant.id);
  if (cubistConfig == null)
    return {
      transaction: null,
      error: "Cubist Configuration not found for the given tenant"
    };
  // 3. Get first wallet by wallet address, if not found return error
  const wallet = await getWallet(senderWalletAddress);
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
  const balance = await getSolBalance(senderWalletAddress);
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
  const transactionStatus = await verifySolanaTransaction(tx?.trxHash!);
  const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
  const stakeAccountStatus = StakeAccountStatus.OPEN;
  const connection = await getSolConnection();
  const stakeAccountInfo = await getStakeAccountInfo(tx?.stakeAccountPubKey?.toString()!, connection);

  console.log("Current Stake Amount", stakeAccountInfo, stakeAccountInfo.currentStakeAmount);
  const newAmount = stakeAccountInfo.currentStakeAmount ? stakeAccountInfo.currentStakeAmount / LAMPORTS_PER_SOL : amount;
  const token = await getToken(symbol);

  const newStakeAccount = await insertStakeAccount(
    senderWalletAddress,
    receiverWalletAddress,
    newAmount,
    chainType,
    symbol,
    tenant.id,
    wallet.customerid,
    tenantUserId,
    process.env["SOLANA_NETWORK"] ?? "",
    stakeAccountStatus,
    tenantTransactionId,
    tx?.stakeAccountPubKey?.toString() || "",
    token?.id as string,
    lockupExpirationTimestamp
  );
  const transaction = await insertStakingTransaction(
    senderWalletAddress,
    receiverWalletAddress,
    newAmount,
    chainType,
    symbol,
    tx?.trxHash || "",
    tenant.id,
    wallet.customerid,
    token?.id as string,
    tenantUserId,
    process.env["SOLANA_NETWORK"] ?? "",
    txStatus,
    tenantTransactionId,
    tx?.stakeAccountPubKey?.toString() || "",
    newStakeAccount.id,
    StakeType.STAKE
  );
  console.log("[solanaStaking]transaction:", transaction);
  return { transaction, error: null };
}

export async function stakeSol(
  senderWalletAddress: string,
  amount: number,
  validatorNodeKey: string,
  oidcToken: string,
  lockupExpirationTimestamp: number,
  cubistOrgId: string
) {
  try {
    const connection = await getSolConnection();
    const validatorAddress = new PublicKey(validatorNodeKey);
    const amountToStake = parseFloat(amount.toString());
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
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
    const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);
    if (senderKey.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    }
    const staketransaction = await createStakeAccountWithStakeProgram(
      connection,
      senderKey[0],
      amountToStake,
      validatorAddress,
      lockupExpirationTimestamp
    );
    return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };
  } catch (err: any) {
    console.log(await err);
    return { trxHash: null, error: err };
  }
}

async function createStakeAccountWithStakeProgram(
  connection: Connection,
  from: Key,
  amount: number,
  validatorPubkey: PublicKey,
  lockupExpirationTimestamp: number
) {
  try {
    const stakeAccount = Keypair.generate();
    console.log("[createStakeAccountWithStakeProgram]stakeAccount:", stakeAccount.publicKey.toBase58());

    const lamports = amount * LAMPORTS_PER_SOL;
    const fromPublicKey = new PublicKey(from.materialId);

    const authorized = new Authorized(fromPublicKey, fromPublicKey);

    const transaction = new Transaction().add(
      StakeProgram.createAccount({
        fromPubkey: fromPublicKey,
        stakePubkey: stakeAccount.publicKey,
        authorized,
        lamports,
        lockup: new Lockup(lockupExpirationTimestamp, 0, fromPublicKey)
      }),

      StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: fromPublicKey,
        votePubkey: validatorPubkey
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPublicKey;

    await signTransaction(transaction, from);
    transaction.partialSign(stakeAccount);

    const tx = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(tx);
    console.log("[createStakeAccountWithStakeProgram]tx:", tx);

    return { txHash: tx, stakeAccountPubKey: stakeAccount.publicKey };
  } catch (err) {
    console.log(`[createStakeAccountWithStakeProgram]err:${err}`);
    throw new Error("Error creating stake account with StakeProgram");
  }
}

async function getLockupDetails(connection: Connection, stakeAccountPubkey: PublicKey) {
  try {
    const stakeAccountInfo = await connection.getParsedAccountInfo(stakeAccountPubkey);
    const stakeAccountData = stakeAccountInfo.value?.data;

    if (!stakeAccountData || !("parsed" in stakeAccountData)) {
      throw new Error("Failed to parse stake account data");
    }

    const stakeAccount = (stakeAccountData as any).parsed.info;
    const lockup = stakeAccount.meta.lockup;

    return new Lockup(lockup.unixTimestamp, lockup.epoch, new PublicKey(lockup.custodian));
  } catch (err) {
    console.error(err);
    throw new Error("Error retrieving lockup details");
  }
}

async function addStakeToExistingAccount(
  connection: Connection,
  from: Key,
  existingStakeAccountPubkey: PublicKey,
  voteAccountPubkey: PublicKey,
  amount: number
) {
  const fromPublicKey = new PublicKey(from.materialId);
  const tempStakeAccount = Keypair.generate();
  const lamportsForStake = amount * LAMPORTS_PER_SOL;
  const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
  const totalLamports = lamportsForStake + lamportsForRentExemption;
  const lockupDetails = await getLockupDetails(connection, existingStakeAccountPubkey);

  const authorized = new Authorized(fromPublicKey, fromPublicKey);

  // Create and delegate the temporary stake account
  let transaction = new Transaction().add(
    StakeProgram.createAccount({
      fromPubkey: fromPublicKey,
      stakePubkey: tempStakeAccount.publicKey,
      authorized,
      lamports: totalLamports,
      lockup: lockupDetails
    }),
    StakeProgram.delegate({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
      votePubkey: voteAccountPubkey
    })
  );

  let { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  transaction.partialSign(tempStakeAccount);

  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Temporary stake account created and delegated with signature:", tx);

  // Merge the temporary stake account with the existing stake account
  transaction = new Transaction().add(
    StakeProgram.merge({
      stakePubkey: existingStakeAccountPubkey,
      sourceStakePubKey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey
    })
  );

  blockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);

  tx = await connection.sendRawTransaction(transaction.serialize(), { skipPreflight: true });
  await connection.confirmTransaction(tx);
  console.log("Stake accounts merged with signature:", tx);
  return { txHash: tx, stakeAccountPubKey: tempStakeAccount.publicKey };
}

export async function withdrawFromStakeAccounts(connection: Connection, accountPubkey: any, payerKey: Key, tenantId: string) {
  const stakeAccountData = await getStakeAccounData(accountPubkey, tenantId);
  stakeAccountData?.updatedat;
  const unStakeDate = new Date(stakeAccountData?.updatedat || "");
  const withdrawDate = new Date();
  const diffTime = Math.abs(withdrawDate.getTime() - unStakeDate.getTime());
  const diffDays = Math.abs(diffTime / (1000 * 60 * 60 * 24));
  console.log("diffDays", diffDays, "difftime", diffTime, unStakeDate, withdrawDate);
  if (stakeAccountData === null || stakeAccountData.status == StakeAccountStatus.CLOSED) {
    return { data: null, error: "No stake account found for this user " };
  }

  if (diffDays < 1) {
    const requiredTime = 1000 * 60 * 60 * 24;
    let remainingTimeInHours = (requiredTime - diffTime) / (1000 * 60 * 60);
    remainingTimeInHours = Math.ceil(remainingTimeInHours);
    console.log(`No stake account found for pubkey: ${accountPubkey}`);
    return { data: null, error: "Withdrawal is not allowed at this time. Please try again after " + remainingTimeInHours + " hours." };
  }

  const payerPublicKey = new PublicKey(payerKey.materialId);
  const stakePubkey = new PublicKey(accountPubkey);
  const accountInfo = await connection.getParsedAccountInfo(stakePubkey);

  if (accountInfo.value !== null && (accountInfo.value.data as any).program === "stake") {
    const lamports = (accountInfo.value.data as any).parsed.info.stake?.delegation?.stake;
    const transaction = new Transaction().add(
      StakeProgram.withdraw({
        stakePubkey: stakePubkey,
        authorizedPubkey: payerPublicKey,
        toPubkey: payerPublicKey,
        lamports: lamports
      })
    );

    transaction.feePayer = payerPublicKey;
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.recentBlockhash = blockhash;

    await signTransaction(transaction, payerKey);
    try {
      const tx = await connection.sendRawTransaction(transaction.serialize());
      await connection.confirmTransaction(tx);
      const stakeTrx = await createWithdrawTransaction(accountPubkey, tx);
      await updateStakeAccount(accountPubkey, StakeAccountStatus.CLOSED);
      console.log(`Withdrawn ${lamports} lamports from ${accountPubkey}, transaction signature: ${tx}`);

      return { data: stakeTrx, error: null };
    } catch (error) {
      console.error(`Failed to withdraw from ${accountPubkey}:`, error);
      return { data: null, error: `Failed to withdraw from ${accountPubkey}:` + error };
    }
  } else {
    console.log(`No stake account found or invalid account for pubkey: ${accountPubkey}`);
    return { data: null, error: `No stake account found or invalid account for pubkey: ${accountPubkey}` };
  }
}

export async function mergeStakeAccounts(connection: Connection, stakeAccounts: string[], payerKey: Key) {
  const payerPublicKey = new PublicKey(payerKey.materialId);
  let mergedStakeAccounts = [];
  let remainingStakeAccounts = [];

  while (stakeAccounts.length > 0) {
    const baseAccount = stakeAccounts.shift() as string;
    const basePubkey = new PublicKey(baseAccount);
    let canMerge = false;

    for (let i = 0; i < stakeAccounts.length; i++) {
      const targetAccount = stakeAccounts[i];
      const targetPubkey = new PublicKey(targetAccount);

      // Check if the stake accounts can be merged
      const baseAccountInfo = await connection.getParsedAccountInfo(basePubkey);
      const targetAccountInfo = await connection.getParsedAccountInfo(targetPubkey);

      const baseWithdrawAuthority = (baseAccountInfo?.value?.data as any).parsed.info.meta.authorized.withdrawer;
      const targetWithdrawAuthority = (targetAccountInfo?.value?.data as any).parsed.info.meta.authorized.withdrawer;
      const baseLockup = (baseAccountInfo?.value?.data as any).parsed.info.meta.lockup;
      const targetLockup = (targetAccountInfo?.value?.data as any).parsed.info.meta.lockup;

      if (
        baseWithdrawAuthority === targetWithdrawAuthority &&
        baseLockup.custodian === targetLockup.custodian &&
        baseLockup.epoch === targetLockup.epoch &&
        baseLockup.unixTimestamp === targetLockup.unixTimestamp
      ) {
        // Merge stake accounts
        const transaction = new Transaction().add(
          StakeProgram.merge({
            stakePubkey: new PublicKey(baseAccount),
            sourceStakePubKey: targetPubkey,
            authorizedPubkey: new PublicKey(baseWithdrawAuthority)
          })
        );

        transaction.feePayer = payerPublicKey;
        const blockhash = (await connection.getLatestBlockhash()).blockhash;
        transaction.recentBlockhash = blockhash;

        await signTransaction(transaction, payerKey);
        const signature = await connection.sendRawTransaction(transaction.serialize());
        await connection.confirmTransaction(signature);
        console.log(`Merged ${targetAccount} into ${baseAccount}, transaction signature: ${signature}`);
        await insertMergeStakeAccountsTransaction(targetAccount, baseAccount, signature);
        await mergeDbStakeAccounts(targetAccount, baseAccount);
        // Remove the merged account from the list
        stakeAccounts.splice(i, 1);
        canMerge = true;
        break;
      }
    }

    if (canMerge) {
      mergedStakeAccounts.push(baseAccount);
    } else {
      remainingStakeAccounts.push(baseAccount);
    }
  }

  return { mergedStakeAccounts, remainingStakeAccounts };
}
