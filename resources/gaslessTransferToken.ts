import {
  Connection,
  Transaction,
  PublicKey,
  type Commitment
} from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction, getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
  TokenInvalidMintError, TokenInvalidOwnerError,
  Account, getAccount
} from '@solana/spl-token';
import * as cs from "@cubist-labs/cubesigner-sdk";
import {getCsSignerKeyFromOidcToken, getPayerCsSignerKey} from "./CubeSignerClient";
// Define the network to connect to (e.g., mainnet-beta, testnet, devnet)
const SOLANA_NETWORK_URL = process.env["SOLANA_NETWORK_URL"] ?? 'https://api.devnet.solana.com'; // Use 'https://api.mainnet-beta.solana.com' for mainnet
const connection = new Connection(SOLANA_NETWORK_URL, 'confirmed');
const ORG_ID = process.env["ORG_ID"]!;
const env: any = {
  SignerApiRoot:
    process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev",
};

export const handler = async (event: any,context:any) => {
  try{
// 1. Collect values from events
    const mintAddress = new PublicKey(event.mintAddress);
    const amount=event.amount;
    const oidcToken=event.oidcToken;
    const recipientPublicKey=new PublicKey(event.recipientPublicKey)

    // 2. Get the sender key from oidcToken
    const senderKey = await getCsSignerKeyFromOidcToken(env, ORG_ID, oidcToken,['sign:*']);
    const senderPublicKey=new PublicKey(senderKey.materialId)

    // 3. Get the payer key
    const payerKey=await getPayerCsSignerKey()
    const payerPublicKey=new PublicKey(payerKey.materialId)


    // 4. Get or create the associated token accounts for the sender and recipient
    const senderTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKey,
      mintAddress,
      senderPublicKey
    );

    const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payerKey,
      mintAddress,
      recipientPublicKey
    );

    // 5. Create a transaction to transfer tokens
    const transaction = new Transaction().add(
      createTransferInstruction(
        senderTokenAccount.address,
        recipientTokenAccount.address,
        senderPublicKey,
        amount // Amount of tokens to transfer (in smallest unit of the token, e.g., for SPL tokens with 6 decimals, 1e6 represents 1 token)
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
    const respPayer = await payerKey.signSolana({ message_base64: base64Payer });
    const sigPayer = respPayer.data().signature;
    const sigBytesPayer = Buffer.from(sigPayer.slice(2), "hex");
    transaction.addSignature(payerPublicKey,sigBytesPayer)

    // 9.Sign the transaction with sender
    const base64Sender = transaction.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respSender = await senderKey.signSolana({ message_base64: base64Sender });
    const sigSender = respSender.data().signature;
    const sigBytesSender = Buffer.from(sigSender.slice(2), "hex");
    transaction.addSignature(senderPublicKey,sigBytesSender)

    // 10.Send the transaction
    await connection.sendRawTransaction(transaction.serialize())
    console.log('Transaction successful with signature');
    return {
      status: 'success'
    };
  }catch (e) {
    return {
      status: 'error',
      error: e
    }
  }
};


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
const createAssociatedTokenAccount = async ( connection: Connection,
                                             mint: PublicKey,
                                             owner: PublicKey,
                                             allowOwnerOffCurve = false,
                                             payerKey:cs.Key,
                                             programId = TOKEN_PROGRAM_ID,
                                             associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID)=>{
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId
  );
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
  transaction.addSignature(new PublicKey(payerKey.materialId),sigBytes)

  const txHash = await connection.sendRawTransaction(transaction.serialize());
  console.log(`txHash: ${txHash}`);
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
  const associatedToken = getAssociatedTokenAddressSync(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId
  );

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
        await createAssociatedTokenAccount(connection,mint,owner,false,payer)
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

