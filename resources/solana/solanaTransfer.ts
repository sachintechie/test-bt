import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant, TransactionStatus } from "../db/models";
import { getCubistConfig, getWalletAndTokenByWalletAddressBySymbol, insertTransaction } from "../db/dbFunctions";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { oidcLogin } from "../cubist/CubeSignerClient";
import { transferSPLToken } from "./solanaSPLTransferGasLess";
import { getSolBalance, getSolConnection, getSplTokenBalance, verifySolanaTransaction } from "./solanaFunctions";
import {logWithTrace} from "../utils/utils";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function solanaTransfer(
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
  logWithTrace("Wallet Address", senderWalletAddress,symbol,"symbol");

  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please send a valid identity token for verification"
      };
    } else {
      const cubistConfig = await getCubistConfig(tenant.id);
      if (cubistConfig == null) {
        return {
          transaction: null,
          error: "Cubist Configuration not found for the given tenant"
        };
      }
      const wallet = await getWalletAndTokenByWalletAddressBySymbol(senderWalletAddress, tenant, symbol);
      let balance = 0;
      logWithTrace(wallet, "Wallet");
      if (wallet.length == 0) {
        return {
          transaction: null,
          error: "Wallet not found for the given wallet address"
        };
      } else {
        for (const token of wallet) {

          if (token.symbol == symbol && symbol === "SOL" && token.customerid != null) {
            console.log(token, "SOL data");
            balance = await getSolBalance(senderWalletAddress);
            token.balance = balance;
            console.log("Balance", balance);
            if (balance >= amount) {
              const trx = await transferSOL(senderWalletAddress, receiverWalletAddress, amount, oidcToken, cubistConfig.orgid);
              if (trx.trxHash != null) {
                const transactionStatus = await verifySolanaTransaction(trx.trxHash);
                const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
                const transaction = await insertTransaction(
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
          } 
          else if (token.symbol == symbol && symbol !== "SOL" && token.customerid != null) {
            console.log(token, "Token data");

            balance = await getSplTokenBalance(senderWalletAddress, token.contractaddress ? token.contractaddress : "");
            console.log("Balance", balance);  
            token.balance = balance;
            if (balance >= amount && token.decimalprecision != undefined && token.contractaddress != null) {
              const trx = await transferSPLToken(
                senderWalletAddress,
                receiverWalletAddress,
                amount,
                token.decimalprecision,
                oidcToken,
                chainType,
                token.contractaddress,
                tenant,
                cubistConfig.orgid
              );

              if (trx.trxHash != null) {
                const transactionStatus = await verifySolanaTransaction(trx.trxHash);

                const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

                const transaction = await insertTransaction(
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

async function transferSOL(
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  oidcToken: string,
  cubistOrgId: string
) {
  try {
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    if (!oidcClient) {
      return {
        trxHash: null,
        error: "Please send a valid identity token for verification"
      };
    }
    // Just grab the first key for the user
    const keys = await oidcClient.sessionKeys();
    console.log("Keys", keys);
    const key = keys.filter((key: cs.Key) => {
      console.log(key.materialId)
      return key.materialId === senderWalletAddress
    });

    if (key.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    } else {
      const connection = await getSolConnection();
      const fromPubkey = new PublicKey(senderWalletAddress);
      const toPubkey = new PublicKey(receiverWalletAddress);
      const sendingAmount = parseFloat(amount.toString());
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: sendingAmount * LAMPORTS_PER_SOL
        })
      );
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
      tx.feePayer = fromPubkey;
      const base64 = tx.serializeMessage().toString("base64");
      const resp = await key[0].signSolana({ message_base64: base64 });
      const sig = resp.data().signature;
      // conver the signature 0x... to bytes
      const sigBytes = Buffer.from(sig.slice(2), "hex");
      tx.addSignature(fromPubkey, sigBytes);

      // send transaction
      const txHash = await connection.sendRawTransaction(tx.serialize());
      await connection.confirmTransaction(txHash);
      console.log(`txHash: ${txHash}`);
      return { trxHash: txHash, error: null };
    }
  } catch (err) {
    console.log(err);
    return { trxHash: null, error: err };
  }
}
