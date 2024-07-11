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
  getAccount
} from "@solana/spl-token";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { oidcLogin, getPayerCsSignerKey } from "../cubist/CubeSignerClient";
import { getSolConnection } from "./solanaFunctions";
import { tenant } from "../db/models";
import { getCubistConfig } from "../db/dbFunctions";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function transferSPLToken(
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  decimalPrecision: number,
  oidcToken: string,
  chainType: string,
  contractAddress: string,
  tenant: tenant,
  cubistOrgId: string
) {
  try {
    const connection = await getSolConnection();

    // 1. Collect values from events
    const mintAddress = new PublicKey(contractAddress);
    //let sendingAmount = parseFloat(amount.toString());
    console.log("decimalPrecision", decimalPrecision);
    let LAMPORTS_PER_SPLTOKEN = 10 ** decimalPrecision;
    console.log("LAMPORTS_PER_SPLTOKEN", LAMPORTS_PER_SPLTOKEN);

    const sendingAmount = amount * LAMPORTS_PER_SPLTOKEN;
    console.log("Sending Amount", sendingAmount);
    console.log("Amount", amount);

    const recipientPublicKey = new PublicKey(receiverWalletAddress);

    // 2. Get the oidcClient key from oidcToken
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    if (!oidcClient) {
      return {
        trxHash: null,
        error: "Please send a valid identity token for verification"
      };
    }

    const cubistConfig = await getCubistConfig(tenant.id);
    if (cubistConfig == null) {
      return {
        transaction: null,
        error: "Cubist Configuration not found for the given tenant"
      };
    }
    const keys = await oidcClient.sessionKeys();
    const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress)[0];

    const senderPublicKey = new PublicKey(senderKey.materialId);

    // 3. Get the payer key
    const payerKey = await getPayerCsSignerKey(chainType, tenant.id);
    if (payerKey.key == null) {
      return {
        trxHash: null,
        error: payerKey.error
      };
    }
    const payerPublicKey = new PublicKey(payerKey.key.materialId);
    //Check sol balance on payer address
    const payerSolBalance = await connection.getBalance(payerPublicKey);
    if (payerSolBalance < 0.05) {
      return {
        trxHash: null,
        error: "Insufficient balance in payer account"
      };
    }
    // 4. Get or create the associated token accounts for the sender and recipient
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payerKey.key, mintAddress, senderPublicKey);

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(connection, payerKey.key, mintAddress, recipientPublicKey);

    // 5. Create a transaction to transfer tokens
    const transaction = new Transaction().add(
      createTransferInstruction(
        senderTokenAccount.address,
        recipientTokenAccount.address,
        senderPublicKey,
        sendingAmount // Amount of tokens to transfer (in smallest unit of the token, e.g., for SPL tokens with 6 decimals, 1e6 represents 1 token)
      )
    );

    // 6.Sign the transaction with the sender's keypair,Set the fee payer to the payer's public key
    transaction.feePayer = payerPublicKey;

    // 7.Specify the recent blockhash
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;

    // 8.Sign the transaction with payer
    const base64Payer = transaction.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respPayer = await payerKey.key.signSolana({ message_base64: base64Payer });
    const sigPayer = respPayer.data().signature;
    const sigBytesPayer = Buffer.from(sigPayer.slice(2), "hex");
    transaction.addSignature(payerPublicKey, sigBytesPayer);

    // 9.Sign the transaction with sender
    const base64Sender = transaction.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respSender = await senderKey.signSolana({ message_base64: base64Sender });
    const sigSender = respSender.data().signature;
    const sigBytesSender = Buffer.from(sigSender.slice(2), "hex");
    transaction.addSignature(senderPublicKey, sigBytesSender);
    console.log("Transaction", transaction);

    // 10.Send the transaction

    const txHash = await connection.sendRawTransaction(transaction.serialize());
    await connection.confirmTransaction(txHash);

    console.log(`txHash: ${txHash}`);
    return { trxHash: txHash, error: null };
  } catch (e) {
    return { trxHash: null, error: e };
  }
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
  const { blockhash } = await connection.getRecentBlockhash();
  transaction.recentBlockhash = blockhash;
  const base64 = transaction.serializeMessage().toString("base64");
  const resp = await payerKey.signSolana({ message_base64: base64 });
  const sig = resp.data().signature;
  const sigBytes = Buffer.from(sig.slice(2), "hex");
  transaction.addSignature(new PublicKey(payerKey.materialId), sigBytes);

  const txHash = await connection.sendRawTransaction(transaction.serialize());
  console.log(`txHash: ${txHash}`);
};

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
export async function getOrCreateAssociatedTokenAccount(
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

  // This is the optimal logic, considering TX fee, client-side computation, RPC roundtrips and guaranteed idempotent.
  // Sadly we can't do this atomically.
  let account: Account;
  try {
    account = await getAccount(connection, associatedToken, commitment, programId);
  } catch (error: unknown) {
    // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
    // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
    // TokenInvalidAccountOwnerError in this code path.
    if (error instanceof TokenAccountNotFoundError || error instanceof TokenInvalidAccountOwnerError) {
      // As this isn't atomic, it's possible others can create associated accounts meanwhile.
      try {
        await createAssociatedTokenAccount(connection, mint, owner, false, payer);
      } catch (error: unknown) {
        // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
        // instruction error if the associated account exists already.
      }

      // Now this should always succeed
      account = await getAccount(connection, associatedToken, commitment, programId);
    } else {
      throw error;
    }
  }

  if (!account.mint.equals(mint)) throw new TokenInvalidMintError();
  if (!account.owner.equals(owner)) throw new TokenInvalidOwnerError();

  return account;
}
