import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import { getCubistConfig, getStakeAccount, getWalletAndTokenByWalletAddress, insertStakeAccount, insertStakingTransaction, updateStakeAccountAmount, updateStakeAccountStatus, updateWallet } from "../db/dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Keypair,
  Authorized, Transaction, Lockup
} from "@solana/web3.js";
import { oidcLogin, signTransaction } from "../cubist/CubeSignerClient";
import { getSolBalance, getSolConnection, getSplTokenBalance, verifySolanaTransaction } from "./solanaFunctions";
import {Key} from "@cubist-labs/cubesigner-sdk";

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
  tenantTransactionId: string,
  lockupExpirationTimestamp: number
) {
  console.log("Wallet Address", senderWalletAddress);

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
      }
      const wallet = await getWalletAndTokenByWalletAddress(senderWalletAddress, tenant, symbol);
      let balance = 0;
      console.log(wallet, "Wallet");
      if (wallet.length == 0) {
        return {
          transaction: null,
          error: "Wallet not found for the given wallet address"
        };
      } else {
        const token = wallet[0];
        const stakeAccount = await getStakeAccount(senderWalletAddress,tenant.id,token.customerid
        );
          if (symbol === "SOL" && token.customerid != null) {
            balance = await getSolBalance(senderWalletAddress);
            token.balance = balance;
            if (balance >= amount) {
              // Check if the stake
              const trx = await stakeSol(senderWalletAddress, stakeAccount?.stakeaccountpubkey, amount, receiverWalletAddress, oidcToken,lockupExpirationTimestamp,cubistConfig.orgid);
              if (trx.trxHash != null && trx.stakeAccountPubKey != null) {
                console.log( "trx.stakeTxHash", trx.trxHash, "trx.delegateTxHash");
                const transactionStatus = await verifySolanaTransaction(trx.trxHash);
                const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
                const stakeAccountStatus = StakeAccountStatus.OPEN;

                if(stakeAccount == null){
                const newStakeAccount = await insertStakeAccount(
                  senderWalletAddress,
                  receiverWalletAddress,
                  amount,
                  chainType,
                  symbol,
                  tenant.id,
                  token.customerid,
                  tenantUserId,
                  process.env["SOLANA_NETWORK"] ?? "",
                  stakeAccountStatus,
                  tenantTransactionId,
                  trx.stakeAccountPubKey.toString(),
                  lockupExpirationTimestamp
                );
              
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
                  trx.stakeAccountPubKey.toString(),
                  newStakeAccount.stakeaccountid,
                  StakeType.STAKE

                );
                return { transaction, error: null };

              }
              else{
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
                  trx.stakeAccountPubKey.toString(),
                  stakeAccount.id,
                  StakeType.STAKE
                );

                const update = await updateStakeAccountAmount(stakeAccount.id,amount);
                return { transaction, error: null };
              }
                   
                //const wallet = await updateWallet(token.customerid, tenant.id,trx.stakeAccountPubKey.toString(),chainType);
          
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
        
        return { transaction: null, error: "Wallet not found" };
      }
    }
  } catch (err) {
    console.log(err);
    return { transaction: null, error: err };
  }
}

export async function stakeSol(
  senderWalletAddress: string, stakeAccountPubKey: string, amount: number, validatorNodeKey: string, oidcToken: string,lockupExpirationTimestamp: number,cubistOrgId:string
) {
  try{
  const connection = await getSolConnection();
  const validatorAddress = new PublicKey(validatorNodeKey);
  console.log("validatorAddress",validatorAddress.toString());
  const amountToStake = parseFloat(amount.toString());
  // const amountToStake = sendingAmount * LAMPORTS_PER_SOL;
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

  if(stakeAccountPubKey === null || stakeAccountPubKey === undefined){

  // Connect to the Solana cluster
  if (senderKey.length === 0) {
    return {
      trxHash: null,
      error: "Given identity token is not the owner of given wallet address"
    };
  }
  const staketransaction = await createStakeAccountWithStakeProgram(connection, senderKey[0], amountToStake,validatorAddress,lockupExpirationTimestamp);
  // Delegate the stake to the validator
 // const tx=await delegateStake(connection, senderKey[0], stakeAccountWithStakeProgram.publicKey, validatorAddress);
  return { trxHash: staketransaction.txHash,stakeAccountPubKey:staketransaction.stakeAccountPubKey ,error: null };
}
else{
  //need to write code of merge stake account
  const staketransaction = await addStakeToExistingAccount(connection, senderKey[0], new PublicKey(stakeAccountPubKey), validatorAddress, amountToStake,lockupExpirationTimestamp);
  return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };  
}

  } catch (err:any) {
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
      lockup: new Lockup(lockupExpirationTimestamp,0,fromPublicKey)
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

async function addStakeToExistingAccount(
  connection: Connection,
  from: Key,
  existingStakeAccountPubkey: PublicKey,
  voteAccountPubkey: PublicKey,
  amount: number,
  lockupExpirationTimestamp: number
) {
  const fromPublicKey= new PublicKey(from.materialId);
  const tempStakeAccount = Keypair.generate();
  const lamportsForStake = amount * LAMPORTS_PER_SOL;
  const lamportsForRentExemption = await connection.getMinimumBalanceForRentExemption(StakeProgram.space);
  const totalLamports = lamportsForStake + lamportsForRentExemption;

  const authorized = new Authorized(fromPublicKey, fromPublicKey);

  // Create and delegate the temporary stake account
  let transaction = new Transaction().add(
    StakeProgram.createAccount({
      fromPubkey: fromPublicKey,
      stakePubkey: tempStakeAccount.publicKey,
      authorized,
      lamports: totalLamports,
      lockup: new Lockup(lockupExpirationTimestamp,0,fromPublicKey)
    }),
    StakeProgram.delegate({
      stakePubkey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
      votePubkey: voteAccountPubkey,
    })
  );

  let { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction,from);
  transaction.partialSign(tempStakeAccount);

  let tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Temporary stake account created and delegated with signature:', tx);

  // Merge the temporary stake account with the existing stake account
  transaction = new Transaction().add(
    StakeProgram.merge({
      stakePubkey: existingStakeAccountPubkey,
      sourceStakePubKey: tempStakeAccount.publicKey,
      authorizedPubkey: fromPublicKey,
    })
  );

  blockhash = (await connection.getRecentBlockhash()).blockhash;
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPublicKey;

  await signTransaction(transaction,from);
  // transaction.partialSign(tempStakeAccount);

  tx = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(tx);
  console.log('Stake accounts merged with signature:', tx);
  return {txHash : tx,stakeAccountPubKey:existingStakeAccountPubkey};

}



