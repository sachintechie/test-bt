import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant, TransactionStatus } from "./models";
import { getWalletAndTokenByWalletAddress, insertStakingTransaction, insertTransaction } from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  GetProgramAccountsFilter,
  StakeProgram,
  clusterApiUrl,
  sendAndConfirmTransaction,
  Keypair
} from "@solana/web3.js";
import { oidcLogin } from "./CubeSignerClient";
import { transferSPLToken } from "./solanaSPLTransferGasLess";

const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
const SOLANA_NETWORK_URL = process.env["SOLANA_NETWORK_URL"] ?? "https://api.devnet.solana.com"; // Use 'https://api.mainnet-beta.solana.com' for mainnet
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
              if (trx.stakeTxHash != null) {
                console.log(trx.stakeTxHash, "trx.stakeTxHash", trx.delegateTxHash, "trx.delegateTxHash");
                const transactionStatus = await verifySolanaTransaction(trx.stakeTxHash);
                const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

                const transaction = await insertStakingTransaction(
                  senderWalletAddress,
                  receiverWalletAddress,
                  amount,
                  chainType,
                  symbol,
                  trx.stakeTxHash,
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
              //   const trx = await transferSPLToken(
              //     senderWalletAddress,
              //     receiverWalletAddress,
              //     amount,
              //     token.decimalprecision,
              //     oidcToken,
              //     chainType,
              //     token.contractaddress,
              //     tenant.id

              //   );

              //   if (trx.trxHash != null) {
              //     const transactionStatus = await verifySolanaTransaction(trx.trxHash);

              //     const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

              //     const transaction = await insertTransaction(
              //       senderWalletAddress,
              //       receiverWalletAddress,
              //       amount,
              //       chainType,
              //       symbol,
              //       trx.trxHash,
              //       tenant.id,
              //       token.customerid,
              //       token.tokenid,
              //       tenantUserId,
              //       process.env["SOLANA_NETWORK"] ?? "",
              //       txStatus,
              //       tenantTransactionId
              //     );
              //     return { transaction, error: null };
              //   } else {
              //     return { transaction: null, error: trx.error };
              //   }
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

async function getSolBalance(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const connection = await getSolConnection();
    const balance = (await connection.getBalance(pubkey)) / LAMPORTS_PER_SOL;
    return balance;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

async function getSplTokenBalance(wallet: string, contractAddress: string) {
  try {
    if (contractAddress === "") {
      return 0; //no contract address
    } else {
      const solanaConnection = await getSolConnection();
      const filters: GetProgramAccountsFilter[] = [
        {
          dataSize: 165 //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32, //location of our query in the account (bytes)
            bytes: wallet //our search criteria, a base58 encoded string
          }
        },
        {
          memcmp: {
            offset: 0, //number of bytes
            bytes: contractAddress //base58 encoded string
          }
        }
      ];
      const accounts = await solanaConnection.getParsedProgramAccounts(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
        filters: filters
      });
      console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
      const parsedAccountInfo: any = accounts[0].account.data;
      console.log(parsedAccountInfo, "parsedAccountInfo");
      //const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      return tokenBalance;
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export async function getSolConnection() {
  console.log(SOLANA_NETWORK_URL);

  const connection = new Connection(SOLANA_NETWORK_URL, "confirmed");
  // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  return connection;
}

export async function verifySolanaTransaction(txId: string) {
  const connection = await getSolConnection();
  const result = await connection.getSignatureStatus(txId, {
    searchTransactionHistory: true
  });
  console.log(result);
  return result.value?.confirmationStatus;
}

async function stakeSol(senderWalletAddress: string, stakeaddress: string, amount: number, validatorNodeKey: string, oidcToken: string) {
  const sendingAmount = parseFloat(amount.toString());
  try {
    const oidcClient = await oidcLogin(env, ORG_ID, oidcToken, ["sign:*"]);
    if (!oidcClient) {
      return {
        trxHash: null,
        error: "Please send a valid identity token for verification"
      };
    }
    // Just grab the first key for the user
    const keys = await oidcClient.sessionKeys();
    console.log("Keys", keys);
    const key = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress);

    if (key.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    } else {
      // Connect to the Solana cluster
      const connection = await getSolConnection();

      // Create a new keypair or load an existing one
      //const fromKeypair = solanaWeb3.Keypair.generate(); // Or load from existing seed
      const fromPubkey = new PublicKey(senderWalletAddress);

      // Create a stake account
       const stakeAccount = Keypair.generate();
       console.log("Stake Account", stakeAccount,"stakeaccountpubkey",stakeAccount.publicKey.toString());
      //const stakeAccountPubKey = new PublicKey(stakeaddress);

      // Define the amount of SOL to stake (in lamports)
      // const amountToStake = solanaWeb3.LAMPORTS_PER_SOL; // 1 SOL
      const amountToStake = sendingAmount * LAMPORTS_PER_SOL;

      // Create stake account transaction
      const createStakeAccountTransaction = StakeProgram.createAccount({
        fromPubkey: fromPubkey,
        stakePubkey: stakeAccount.publicKey,
        authorized: {
          staker: fromPubkey,
          withdrawer: fromPubkey
        },
        lamports: amountToStake
      });

        
  
createStakeAccountTransaction.feePayer = fromPubkey;
createStakeAccountTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

// // 8.Sign the transaction with sender

// const base64 = createStakeAccountTransaction.serializeMessage().toString("base64");
// const resp = await key[0].signSolana({ message_base64: base64 });
// const sig = resp.data().signature;
// console.log("Sender Signature via cubist", sig);
// // conver the signature 0x... to bytes
// const sigBytes = Buffer.from(sig.slice(2), "hex");
// createStakeAccountTransaction.addSignature(fromPubkey, sigBytes);
// console.log("add Signature of sender", createStakeAccountTransaction);

// // 8.Sign the transaction with stakeAccount

// createStakeAccountTransaction.sign(stakeAccount);
// console.log("add Signature of stakeaccount", createStakeAccountTransaction);

//        // Send the create stake account transaction
//     let signature = await sendAndConfirmTransaction(
//         connection,
//         createStakeAccountTransaction,
//         [ stakeAccount]
//     );
//     console.log("Stake account created with transaction signature:", signature);

    // const sigStakeAccount = signature;
    // const sigBytesStakeAccount = Buffer.from(sigStakeAccount.slice(2), "hex");
    //  createStakeAccountTransaction.addSignature(stakeAccount.publicKey, sigBytesStakeAccount);
    //console.log("Stake account created with transaction signature:", signature);

      //const stakeTxHash = await connection.sendRawTransaction(createStakeAccountTransaction.serialize());

     // console.log("Stake account created with transaction signature:", stakeTxHash);

      // Delegate stake to a validator
      const validatorPubkey = new PublicKey(validatorNodeKey);
      const delegateStakeTransaction = StakeProgram.delegate({
        stakePubkey: stakeAccount.publicKey,
        authorizedPubkey: fromPubkey,
        votePubkey: validatorPubkey
      });
      delegateStakeTransaction.feePayer = fromPubkey;

      delegateStakeTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      const delegateBase64 = createStakeAccountTransaction.serializeMessage().toString("base64");
      const delegateResp = await key[0].signSolana({ message_base64: delegateBase64 });
      const delegateSig = delegateResp.data().signature;
      console.log("delegate Signature via cubist", delegateSig);
      // conver the signature 0x... to bytes
      const delegateSigBytes = Buffer.from(delegateSig.slice(2), "hex");
      delegateStakeTransaction.addSignature(fromPubkey, delegateSigBytes);
      console.log("add delegate Signature of sender", delegateStakeTransaction);
      // send transaction
      const delegateTxHash = await connection.sendRawTransaction(delegateStakeTransaction.serialize());
      console.log("Stake delegated with transaction signature:", delegateTxHash);

      return { stakeTxHash: delegateTxHash, delegateTxHash: delegateTxHash, error: null };
    }
  } catch (err) {
    console.log(err);
    return { stakeTxHash: null, delegateTxHash: null, error: err };
  }
}
