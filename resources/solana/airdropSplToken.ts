import { Connection, Transaction, PublicKey, type Commitment } from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TokenInvalidMintError,
  TokenInvalidOwnerError,
  Account,
  getAccount,
  getOrCreateAssociatedTokenAccount
} from "@solana/spl-token";

import * as cs from "@cubist-labs/cubesigner-sdk";
import { oidcLogin, getPayerCsSignerKey } from "../cubist/CubeSignerClient";
import { getSolConnection } from "./solanaFunctions";
import { tenant } from "../db/models";
import { getCubistConfig } from "../db/dbFunctions";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function airdropSPLToken(
  receiverWalletAddress: any[],
  amount: number,
  decimalPrecision: number,
  chainType: string,
  contractAddress: string,
  tenant: any
) {
  try {
    console.log("Receiver Wallet Address", receiverWalletAddress);
    const connection = await getSolConnection();

    // 1. Collect values from events
    const mint = new PublicKey(contractAddress);
    //let sendingAmount = parseFloat(amount.toString());
    console.log("decimalPrecision", decimalPrecision);
    let LAMPORTS_PER_SPLTOKEN = 10 ** decimalPrecision;
    console.log("LAMPORTS_PER_SPLTOKEN", LAMPORTS_PER_SPLTOKEN);

    const sendingAmount = amount * LAMPORTS_PER_SPLTOKEN;
    console.log("Sending Amount", sendingAmount);
    console.log("Amount", amount);

    const cubistConfig = await getCubistConfig(tenant.id);
    if (cubistConfig == null) {
      return {
        transaction: null,
        error: "Cubist Configuration not found for the given tenant"
      };
    }

    // 3. Get the payer key
    const payerKey = await getPayerCsSignerKey(chainType, tenant.id);
    if (payerKey.key == null) {
      return {
        trxHash: null,
        error: payerKey.error
      };
    }
    const payerPublicKey = new PublicKey(payerKey.key.materialId);
    console.log("Payer Public Key", payerPublicKey, payerKey.key.materialId);
    //Check sol balance on payer address
    const payerSolBalance = await connection.getBalance(payerPublicKey);
    if (payerSolBalance < 0.05) {
      return {
        trxHash: null,
        error: "Insufficient balance in payer account"
      };
    }

    const fromTokenAccount = await getOrCreateAssociatedTokenAccountForKey(connection, payerKey.key, mint, payerPublicKey);

    // Get the wallet's associated token account for the given mint

    console.log("From Token Account", fromTokenAccount);
    const instructions = [];
    for (const recipient of receiverWalletAddress) {
      // const toWallet = new PublicKey(receiverWalletAddress[0].walletaddress);
      const toWallet = new PublicKey(recipient.walletaddress);
      const toTokenAccount = await getOrCreateAssociatedTokenAccountForKey(connection, payerKey.key, mint, toWallet);

      //  const toTokenAccount = await getOrCreateAssociatedAccountInfo(recipient.walletaddress);

      // const toTokenAccount = await getOrCreateRecipientAssociatedTokenAccount(
      //   connection, toWallet, mint, toWallet

      // );
      // console.log("To Token Account", toTokenAccount);

      instructions.push(
        createTransferInstruction(fromTokenAccount.address, toTokenAccount.address, payerPublicKey, sendingAmount, [], TOKEN_PROGRAM_ID)
      );
    }

    // 5. Create a transaction to transfer tokens
    const transaction = new Transaction().add(...instructions);
    console.log("instructions", instructions);

    // 6.Sign the transaction with the sender's keypair,Set the fee payer to the payer's public key
    transaction.feePayer = payerPublicKey;

    // 7.Specify the recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // 8.Sign the transaction with payer
    const base64Payer = transaction.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respPayer = await payerKey.key.signSolana({ message_base64: base64Payer });
    const sigPayer = respPayer.data().signature;
    const sigBytesPayer = Buffer.from(sigPayer.slice(2), "hex");
    transaction.addSignature(payerPublicKey, sigBytesPayer);

    // // 9.Sign the transaction with sender
    // const base64Sender = transaction.serializeMessage().toString("base64");
    // // sign using the well-typed solana end point (which requires a base64 serialized Message)
    // const respSender = await payerKey.key.signSolana({ message_base64: base64Sender });
    // const sigSender = respSender.data().signature;
    // const sigBytesSender = Buffer.from(sigSender.slice(2), "hex");
    // transaction.addSignature(payerPublicKey, sigBytesSender);
    console.log("Transaction", transaction);

    // 10.Send the transaction

    const txHash = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(txHash);

    console.log(`txHash: ${txHash}`);
    return { trxHash: txHash, error: null };
  } catch (e) {
    console.log("from airdrop fun", e);
    return { trxHash: null, error: e };
  }
}

/**
 * Get or create an associated token account for a given mint and owner
 * @param connection
 * @param payer
 * @param mint
 * @param owner
 * @param allowOwnerOffCurve
 * @param commitment
 * @param programId
 * @param associatedTokenProgramId
 */
export async function getOrCreateAssociatedTokenAccountForKey(
  connection: Connection,
  payer: cs.Key,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  commitment?: Commitment,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
): Promise<Account> {
  const associatedToken = getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve, programId, associatedTokenProgramId);
  console.log("associatedToken", associatedToken);
  // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
  // Sadly we can't do this atomically.
  let account: Account;
  try {
    account = await getAccount(connection, associatedToken, commitment, programId);
    console.log("account", account);
  } catch (error: unknown) {
    // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
    // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
    // TokenInvalidAccountOwnerError in this code path.
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      // As this isn't atomic, it's possible others can create associated accounts meanwhile.
      try {
        await createAssociatedTokenAccount(connection, mint, owner, false, payer);
      } catch (error: unknown) {
        console.log("error from catch1", error);
        // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
        // instruction error if the associated account exists already.
      }

      // Now this should always succeed

      await delay(1000);
      account = await getAccount(connection, associatedToken, commitment, programId);

      console.log("accountfromcatch", account);
    } else {
      console.log("error from else", error);
      throw error;
    }
  }

  if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
  if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();

  return account;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an associated token account for a given mint and owner
 * @param connection
 * @param mint
 * @param owner
 * @param allowOwnerOffCurve
 * @param payerKey
 * @param programId
 * @param associatedTokenProgramId
 */
const createAssociatedTokenAccount = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
  payerKey: cs.Key,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) => {
  const associatedToken = getAssociatedTokenAddressSync(mint, owner, allowOwnerOffCurve, programId, associatedTokenProgramId);
  const transaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      new PublicKey(payerKey.materialId),
      associatedToken,
      owner,
      mint,
      programId,
      associatedTokenProgramId
    )
  );

  transaction.feePayer = new PublicKey(payerKey.materialId);
  const { blockhash } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  const base64 = transaction.serializeMessage().toString("base64");
  const resp = await payerKey.signSolana({ message_base64: base64 });
  const sig = resp.data().signature;
  const sigBytes = Buffer.from(sig.slice(2), "hex");
  transaction.addSignature(new PublicKey(payerKey.materialId), sigBytes);

  const txHash = await connection.sendRawTransaction(transaction.serialize());
  console.log(`txHashCreateToken: ${txHash}`);
};
