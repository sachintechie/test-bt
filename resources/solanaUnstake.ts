import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./models";
import {
  getCubistConfig,
  getStakeAccountPubkeyByWallets,
  getWalletAndTokenByWalletAddress,
} from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Keypair,
  Authorized,
  Transaction,
} from "@solana/web3.js";
import { oidcLogin, signTransaction } from "./CubeSignerClient";
import { getSolBalance, getSolConnection, verifySolanaTransaction } from "./solanaFunctions";
import { Key } from "@cubist-labs/cubesigner-sdk";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function solanaUnstake(
  tenant: tenant,
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string,
) {
  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please send a valid identity token for verification"
      };
    } else {
      const cubistConfig = await getCubistConfig(tenant.id);
      if(cubistConfig == null) {
        return {
          transaction: null,
          error: "Cubist Configuration not found for the given tenant"
        };
      }      const wallet = await getWalletAndTokenByWalletAddress(senderWalletAddress, tenant, symbol);
      let balance = 0;
      if (wallet.length == 0) {
        return {
          transaction: null,
          error: "Wallet not found for the given wallet address"
        };
      } else {
        for (const token of wallet) {
          if (symbol === "SOL" && token.customerid != null) {
            balance = await getSolBalance(senderWalletAddress);
            token.balance = balance;
            if (balance >= amount) {
               const trx = await unstakeSol(senderWalletAddress, token.stakeaccountpubkey, amount, oidcToken,cubistConfig.orgid);
               return { transaction:trx, error: trx.error };
            } else {
              return {
                transaction: null,
                error: "Insufficient SOL balance"
              };
            }
          } else if (symbol != "SOL" && token.customerid != null) {
            return {
              transaction: null,
              error: "Not Supported"
            };
          }
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

    if (senderKey.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    }

    const stakeAccountPubkey = new PublicKey(stakeAccountPubKey);
    const stakeAccountInfo = await connection.getParsedAccountInfo(stakeAccountPubkey);
    const stakeAccountData = stakeAccountInfo.value?.data;
    if (!stakeAccountData || !('parsed' in stakeAccountData)) {
      return { trxHash: null, error: "Failed to parse stake account data" };
    }
    const stakeAccount = stakeAccountData.parsed.info;

    const currentStakeAmount = stakeAccount.stake?.delegation?.stake ?? 0;

    if (amount * LAMPORTS_PER_SOL > currentStakeAmount) {
      return { trxHash: null, error: "Insufficient staked amount" };
    }

    if (amount * LAMPORTS_PER_SOL === currentStakeAmount) {
      // Fully deactivate and withdraw the stake
      return await deactivateAndWithdrawStake(connection, senderKey[0], stakeAccountPubkey, senderWalletAddress,currentStakeAmount);
    } else {
      // Partially withdraw the stake
      return await partiallyWithdrawStake(connection, senderKey[0], stakeAccountPubkey, senderWalletAddress, amount * LAMPORTS_PER_SOL);
    }
  } catch (err: any) {
    console.log(err);
    return { trxHash: null, error: err };
  }
}

async function deactivateAndWithdrawStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number
) {
  const fromPublicKey = new PublicKey(from.materialId);

  // Deactivate the stake
  let transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey,
    })
  );

  let { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Stake deactivated with signature:', tx);

  // Wait for the cooldown period (typically one epoch) before withdrawing


  // Withdraw the stake
  transaction = new Transaction().add(
    StakeProgram.withdraw({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey,
      toPubkey: new PublicKey(receiverWalletAddress),
      lamports: amount,
    })
  );

  blockhash = (await connection.getRecentBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Stake withdrawn with signature:', tx);

  return { trxHash: tx, stakeAccountPubKey: stakeAccountPubkey,error: null  };
}

async function partiallyWithdrawStake(
  connection: Connection,
  from: Key,
  stakeAccountPubkey: PublicKey,
  receiverWalletAddress: string,
  amount: number
) {
  const fromPublicKey = new PublicKey(from.materialId);
  const tempStakeAccount = Keypair.generate();
  // Calculate the rent-exempt reserve
  const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);

  // Split the stake account
  let transaction = new Transaction().add(
    StakeProgram.split({
      stakePubkey: stakeAccountPubkey,
      authorizedPubkey: fromPublicKey,
      splitStakePubkey: tempStakeAccount.publicKey,
      lamports: amount,
    }, lamportsForRentExemption)
  );

  let {blockhash} = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Stake account split with signature:', tx);

  // Deactivate the split stake account
  transaction = new Transaction().add(
    StakeProgram.deactivate({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
    })
  );

  blockhash = (await connection.getRecentBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Temporary stake account deactivated with signature:', tx);

  // Wait for the cooldown period (typically one epoch) before withdrawing

  // Withdraw the stake
  transaction = new Transaction().add(
    StakeProgram.withdraw({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
      toPubkey: new PublicKey(receiverWalletAddress),
      lamports: amount,
    })
  );

  blockhash = (await connection.getRecentBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction, from);
  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Stake withdrawn with signature:', tx);

  return {trxHash: tx, stakeAccountPubKey: stakeAccountPubkey,error: null};
}
