import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant, TransactionStatus } from "./models";
import { getWalletAndTokenByWalletAddress, insertStakingTransaction } from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Keypair,
  Authorized, Transaction
} from "@solana/web3.js";
import { oidcLogin, signTransaction } from "./CubeSignerClient";
import { getSolBalance, getSolConnection, getSplTokenBalance, verifySolanaTransaction } from "./solanaFunctions";
import {Key} from "@cubist-labs/cubesigner-sdk";

const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
//console.log(SOLANA_NETWORK_URL);

export async function solanaStaking(
  tenant: tenant,
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string
) {
  console.log("Wallet Address", senderWalletAddress);

  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please send a valid identity token for verification"
      };
    } else {
      const wallet = await getWalletAndTokenByWalletAddress(senderWalletAddress, tenant, symbol);
      let balance = 0;
      console.log(wallet, "Wallet");
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
              const trx = await stakeSol(senderWalletAddress, receiverWalletAddress, amount, receiverWalletAddress, oidcToken);
              if (trx.trxHash != null && trx.stakeAccountPubKey != null) {
                console.log( "trx.stakeTxHash", trx.trxHash, "trx.delegateTxHash");
                const transactionStatus = await verifySolanaTransaction(trx.trxHash);
                const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

                const transaction = await insertStakingTransaction(
                  senderWalletAddress,
                  receiverWalletAddress,
                  amount,
                  chainType,
                  symbol,
                  trx.trxHash,
                  tenant.id,
                  token.customerid,
                  token.tokenid,
                  tenantUserId,
                  process.env["SOLANA_NETWORK"] ?? "",
                  txStatus,
                  tenantTransactionId,
                  trx.stakeAccountPubKey.toString()
                );
                return { transaction, error: null };
              } else {
                return { transaction: null, error: trx.error };
              }
            } else {
              return {
                transaction: null,
                error: "Insufficient SOL balance"
              };
            }
          } else if (symbol != "SOL" && token.customerid != null) {
            balance = await getSplTokenBalance(senderWalletAddress, token.contractaddress ? token.contractaddress : "");
            token.balance = balance;
            if (balance >= amount) {
              return {
                transaction: null,
                error: "Not Supported"
              };
            } else {
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
  } catch (err) {
    console.log(err);
    return { transaction: null, error: err };
  }
}

export async function stakeSol(
  senderWalletAddress: string, stakeaddress: string, amount: number, validatorNodeKey: string, oidcToken: string
) {
  try{
  const connection = await getSolConnection();
  const validatorAddress = new PublicKey(validatorNodeKey);
  console.log("validatorAddress",validatorAddress.toString());
  const amountToStake = parseFloat(amount.toString());
  // const amountToStake = sendingAmount * LAMPORTS_PER_SOL;

  const oidcClient = await oidcLogin(env, ORG_ID, oidcToken, ["sign:*"]);
  if (!oidcClient) {
    return {
      trxHash: null,
      stakeAccountPubKey: null,
      error: "Please send a valid identity token for verification"
    };
  }
  const keys = await oidcClient.sessionKeys();
  const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);
  // Connect to the Solana cluster
  if (senderKey.length === 0) {
    return {
      trxHash: null,
      error: "Given identity token is not the owner of given wallet address"
    };
  }
  const staketransaction = await createStakeAccountWithStakeProgram(connection, senderKey[0], amountToStake,validatorAddress);
  // Delegate the stake to the validator
 // const tx=await delegateStake(connection, senderKey[0], stakeAccountWithStakeProgram.publicKey, validatorAddress);
  return { trxHash: staketransaction.txHash,stakeAccountPubKey:staketransaction.stakeAccountPubKey ,error: null };

  } catch (err:any) {
    console.log(await err.getLogs());
    return { trxHash: null, error: err };
  }
}

async function createStakeAccountWithStakeProgram(
  connection: Connection,
  from: Key,
  amount: number,
  validatorPubkey: PublicKey

) {
  const stakeAccount = Keypair.generate();
  console.log('Stake account created with StakeProgram:', stakeAccount.publicKey.toBase58());

  const lamports = amount * LAMPORTS_PER_SOL;
  const fromPublicKey= new PublicKey(from.materialId);

  const authorized = new Authorized(fromPublicKey,fromPublicKey);

  const transaction = new Transaction().add(
    StakeProgram.createAccount({
      fromPubkey: fromPublicKey,
      stakePubkey: stakeAccount.publicKey,
      authorized,
      lamports,
    }),
    StakeProgram.delegate({
      stakePubkey: stakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
      votePubkey: validatorPubkey,
    })
  );

  
  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction,from);
  transaction.partialSign(stakeAccount);

  const tx = await connection.sendRawTransaction(transaction.serialize());
  console.log('Stake account Transaction:', tx);

  return {txHash : tx,stakeAccountPubKey:stakeAccount.publicKey};
}

// Function to delegate stake to a validator
async function delegateStake(
  connection: Connection,
  from: Key,
  stakeAccount: PublicKey,
  validatorPubkey: PublicKey
) {
  const fromPublicKey= new PublicKey(from.materialId);
  console.log('DELEGATE STAKE=>fromPublicKey:', fromPublicKey.toBase58());
  console.log('DELEGATE STAKE=>stakeAccount:', stakeAccount.toBase58());
  console.log('DELEGATE STAKE=>validatorPubkey:', validatorPubkey.toBase58());


  const transaction = StakeProgram.delegate({
    stakePubkey: stakeAccount,
    authorizedPubkey: fromPublicKey,
    votePubkey: validatorPubkey,
  });

  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction,from);
  const tx = await connection.sendRawTransaction(transaction.serialize(),{skipPreflight: true});

  console.log('Stake delegation Transaction:', tx);
  return tx;
}
