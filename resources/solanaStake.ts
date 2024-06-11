import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant, TransactionStatus } from "./models";
import { getWalletAndTokenByWalletAddress, insertStakingTransaction } from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  StakeProgram,
  Keypair,
  Authorized
} from "@solana/web3.js";
import { oidcLogin, signTransaction } from "./CubeSignerClient";
import { getSolBalance, getSolConnection, getSplTokenBalance, verifySolanaTransaction } from "./solanaFunctions";

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
              if (trx.trxHash != null) {
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
                  tenantTransactionId
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
  const senderAddress = new PublicKey(senderWalletAddress);
  const validatorAddress = new PublicKey(validatorNodeKey);
console.log("validatorAddress",validatorAddress.toString());
  let stakeAccountPubkey = await findExistingStakeAccount(connection,senderAddress);
  console.log("Stake Account Pubkey", stakeAccountPubkey);
  const sendingAmount = parseFloat(amount.toString());
  const amountToStake = sendingAmount * LAMPORTS_PER_SOL;


  // const payerKey = await getPayerCsSignerKey(chainType, tenantId);
  // if (payerKey.key == null) {
  //   return {
  //     trxHash: null,
  //     error: payerKey.error}
  // }
  // const payerPublicKey = new PublicKey(payerKey.key.materialId);
  // //Check sol balance on payer address
  // const payerSolBalance = await connection.getBalance(payerPublicKey);
  // if(payerSolBalance < 0.05){
  //   return {
  //     trxHash: null,
  //     error: "Insufficient balance in payer account"
  //   }
  // }

  const oidcClient = await oidcLogin(env, ORG_ID, oidcToken, ["sign:*"]);
  if (!oidcClient) {
    return {
      trxHash: null,
      error: "Please send a valid identity token for verification"
    };
  }
  const keys = await oidcClient.sessionKeys();
  const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);
  const senderPublicKey = new PublicKey(senderKey[0].materialId);

  if (senderKey.length === 0) {
    return {
      trxHash: null,
      error: "Given identity token is not the owner of given wallet address"
    };
  } else {
    // Connect to the Solana cluster
var stakeAccount;
  if (!stakeAccountPubkey) {
    // Create a new stake account if none exists
     stakeAccount = Keypair.generate();
    stakeAccountPubkey = stakeAccount.publicKey;

    console.log("stakeaccountpubkey -after -generate",stakeAccount.publicKey.toString());


    // Transaction to create and initialize a stake account
    const createStakeAccountTx = StakeProgram.createAccount({
      fromPubkey: senderAddress,
      authorized: new Authorized(senderAddress, senderAddress),
      lamports: amountToStake,
      stakePubkey: stakeAccountPubkey,
    });

    createStakeAccountTx.feePayer=senderPublicKey;

    const { blockhash } = await connection.getRecentBlockhash();
    createStakeAccountTx.recentBlockhash = blockhash;

    //await signTransaction(createStakeAccountTx,payerKey.key);
    await signTransaction(createStakeAccountTx,senderKey[0]);
     createStakeAccountTx.partialSign(stakeAccount);

    const txHash = await connection.sendRawTransaction(createStakeAccountTx.serialize());
    console.log(`stakeTxHash: ${txHash}`);
  }

  // Transaction to delegate stake to a validator
  const delegateStakeTx = StakeProgram.delegate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey: senderAddress,
    votePubkey: validatorAddress,
  });
  delegateStakeTx.feePayer=senderPublicKey;

  console.log("delegateStakeTx -before sign",delegateStakeTx);


  const { blockhash } = await connection.getRecentBlockhash();
  delegateStakeTx.recentBlockhash = blockhash;
  // if(stakeAccount != null)
  // delegateStakeTx.partialSign(stakeAccount);

  //await signTransaction(delegateStakeTx,payerKey.key);
  await signTransaction(delegateStakeTx,senderKey[0]);
  console.log("Delegate Stake Tx",delegateStakeTx);

  stakeAccount && delegateStakeTx.partialSign(stakeAccount);
  console.log("Delegate Stake Tx",delegateStakeTx);

  const txHash = await connection.sendRawTransaction(delegateStakeTx.serialize());
  console.log(`delegateTxHash: ${txHash}`);
  return { trxHash: txHash ,error: null };

}
} catch (err) {
  console.log(err);
  return { trxHash: null, error: err };
}
}

async function findExistingStakeAccount(connection:Connection, address:PublicKey) {
  const accounts = await connection.getParsedProgramAccounts(
   StakeProgram.programId,
    {
      filters: [
        {
          dataSize: StakeProgram.space,
        },
        {
          memcmp: {
            offset: 12,
            bytes: address.toBase58(),
          },
        },
      ],
    }
  );
console.log("Existing Stake Account",accounts);
  return accounts.length > 0 ? accounts[0].pubkey : null;
}
