import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import {
  duplicateStakeAccountWithStatus,
  getCubistConfig,
  getToken,
  getWallet,
  insertStakingTransaction,
  reduceStakeAccountAmount,
  updateStakeAccountStatus
} from "../db/dbFunctions";
import { Connection, LAMPORTS_PER_SOL, PublicKey, StakeProgram, Keypair, Transaction } from "@solana/web3.js";
import { oidcLogin, signTransaction } from "../cubist/CubeSignerClient";
import { getSolConnection, getStakeAccountInfo, verifySolanaTransaction } from "./solanaFunctions";
import { Key } from "@cubist-labs/cubesigner-sdk";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function solanaUnStaking(
  tenant: tenant,
  stakeAccountId: string,
  senderWalletAddress: string,
  stakeAccountPubKey: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string
) {
  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please provide an identity token for verification"
      };
    } else {
      const cubistConfig = await getCubistConfig(tenant.id);
      if (cubistConfig == null) {
        return {
          transaction: null,
          error: "Cubist Configuration not found for the given tenant"
        };
      }
      const wallet = await getWallet(senderWalletAddress);
      const token = await getToken(symbol);
      if (!wallet) {
        return {
          transaction: null,
          error: "Wallet not found for the given wallet address"
        };
      } else {
        if (symbol === "SOL" && wallet.customerid != null) {
          const trx = await unstakeSol(senderWalletAddress, stakeAccountPubKey, amount, oidcToken, cubistConfig.orgid);
          if (trx.trxHash != null && trx.stakeAccountPubKey != null) {
            const transactionStatus = await verifySolanaTransaction(trx.trxHash);
            const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

            const transaction = await insertStakingTransaction(
              senderWalletAddress,
              senderWalletAddress,
              amount,
              chainType,
              symbol,
              trx.trxHash,
              tenant.id,
              wallet.customerid,
              token?.id as string,
              tenantUserId,
              process.env["SOLANA_NETWORK"] ?? "",
              txStatus,
              tenantTransactionId,
              trx.stakeAccountPubKey.toString(),
              stakeAccountId,
              StakeType.UNSTAKE
            );
            return { transaction: transaction, error: trx.error };
          } else {
            return { transaction: null, error: trx.error };
          }
        } else if (symbol != "SOL" && wallet.customerid != null) {
          return {
            transaction: null,
            error: "Not Supported"
          };
        }

        return { transaction: null, error: "Wallet not found" };
      }
    }
  } catch (err) {
    console.log(err);
    return { transaction: null, error: err };
  }
}

export async function unstakeSol(
  senderWalletAddress: string,
  stakeAccountPubKey: string,
  amount: number,
  oidcToken: string,
  cubistOrgId: string
) {
  try {
    var isFullyUnStake = false;
    const connection = await getSolConnection();
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    if (!oidcClient) {
      return {
        trxHash: null,
        stakeAccountPubKey: null,
        error: "Please send a valid identity token for verification"
      };
    }
    const keys = await oidcClient.sessionKeys();
    const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);
    console.log("senderKey", senderKey);

    if (senderKey.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    }

    const stakeAccountPubkey = new PublicKey(stakeAccountPubKey);
    const stakeAccountInfo = await getStakeAccountInfo(stakeAccountPubKey, connection);

    console.log("Current Stake Amount", stakeAccountInfo, stakeAccountInfo.currentStakeAmount);
    const currentStakeAmount = stakeAccountInfo.currentStakeAmount / LAMPORTS_PER_SOL;
    if (stakeAccountInfo.currentStakeAmount == null) {
      return { trxHash: null, error: "Failed to parse stake account data" };
    }

    if (amount >= currentStakeAmount) {
      amount = currentStakeAmount;
      console.log("full stake", amount);

      isFullyUnStake = true;
      // Fully deactivate and withdraw the stake
      return await deactivateStake(
        connection,
        senderKey[0],
        stakeAccountPubkey,
        senderWalletAddress,
        stakeAccountInfo.currentStakeAmount,
        isFullyUnStake
      );
    } else {
      console.log("partial stake", amount);

      // Partially withdraw the stake
      return await partiallyDeactivateStake(connection, senderKey[0], stakeAccountPubkey, senderWalletAddress, amount, isFullyUnStake);
    }
  } catch (err: any) {
    console.log(err);
    return { trxHash: null, error: err };
  }
}

async function deactivateStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number,
  isFullyUnStake: boolean
) {
  const fromPublicKey = new PublicKey(from.materialId);

  // Deactivate the stake
  let transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey
    })
  );

  let { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake deactivated with signature:", tx);
  await updateStakeAccountStatus(stakeAccountPubkey.toString(), StakeAccountStatus.DEACTIVATED);
  return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}

async function deactivateAndWithdrawStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number,
  isFullyUnStake: boolean
) {
  const fromPublicKey = new PublicKey(from.materialId);

  // Deactivate the stake
  let transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey
    })
  );

  let { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake deactivated with signature:", tx);

  // Wait for the cooldown period (typically one epoch) before withdrawing

  // Withdraw the stake
  transaction = new Transaction().add(
    StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey,
      toPubkey: new PublicKey(receiverWalletAddress),
      lamports: amount
    })
  );

  blockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake withdrawn with signature:", tx);

  return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}

async function partiallyDeactivateStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number,
  isFullyUnStake: boolean
) {
  const fromPublicKey = new PublicKey(from.materialId);
  const tempStakeAccount = Keypair.generate();
  // Calculate the rent-exempt reserve
  const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

  // Split the stake account
  let transaction = new Transaction().add(
    StakeProgram.split(
      {
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey,
        splitStakePubkey: tempStakeAccount.publicKey,
        lamports: amount * LAMPORTS_PER_SOL
      },
      lamportsForRentExemption
    )
  );

  let { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  transaction.partialSign(tempStakeAccount);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake account split with signature:", tx);

  await duplicateStakeAccountWithStatus(stakeAccountPubkey.toString(), tempStakeAccount.publicKey.toString(), amount, "DEACTIVATED");
  await reduceStakeAccountAmount(stakeAccountPubkey.toString(), amount);

  // Deactivate the split stake account
  transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey
    })
  );

  blockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Temporary stake account deactivated with signature:", tx);

  return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}

async function partiallyWithdrawStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number,
  isFullyUnStake: boolean
) {
  const fromPublicKey = new PublicKey(from.materialId);
  const tempStakeAccount = Keypair.generate();
  // Calculate the rent-exempt reserve
  const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

  // Split the stake account
  let transaction = new Transaction().add(
    StakeProgram.split(
      {
        stakePubkey: stakeAccountPubkey,
        authorizedPubkey: fromPublicKey,
        splitStakePubkey: tempStakeAccount.publicKey,
        lamports: amount
      },
      lamportsForRentExemption
    )
  );

  let { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  transaction.partialSign(tempStakeAccount);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake account split with signature:", tx);

  // Deactivate the split stake account
  transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey
    })
  );

  blockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Temporary stake account deactivated with signature:", tx);

  // Wait for the cooldown period (typically one epoch) before withdrawing

  // Withdraw the stake
  transaction = new Transaction().add(
    StakeProgram.withdraw({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
      toPubkey: new PublicKey(receiverWalletAddress),
      lamports: amount
    })
  );

  blockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log("Stake withdrawn with signature:", tx);

  return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey, isFullyUnStake, error: null };
}
