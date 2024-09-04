import * as cs from "@cubist-labs/cubesigner-sdk";
import { oidcLogin } from "../../cubist/CubeSignerClient";
// import fetch from "node-fetch";
import * as fs from "fs"
import { getCubistConfig  } from "../../db/dbFunctions";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js"



import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  ValidDepthSizePair,
  createAllocTreeIx,
  SPL_NOOP_PROGRAM_ID,
} from "@solana/spl-account-compression"

import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  createCreateTreeInstruction,
  createMintToCollectionV1Instruction,
  MetadataArgs,
  TokenProgramVersion,
  TokenStandard
} from "@metaplex-foundation/mpl-bubblegum"

import { uris } from "./uri"
import { Metaplex, Nft, keypairIdentity } from "@metaplex-foundation/js"
import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { tenant } from "../../db/models";


// Define your Cubist environment configuration
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

// Assuming there is a method to fetch ownerWallet's address from Cubist
const getCubistWalletAddress = async (): Promise<PublicKey> => {
  // Replace the following line with the actual logic to get the wallet address from Cubist
  const cubistWalletAddressString = 'replace_with_cubist_sourced_address';
  return new PublicKey(cubistWalletAddressString);
};

export const getSolanaConnection = (): Connection => {
  const connection = new Connection('https://api.mainnet-beta.solana.com');
  return connection;
};

export const getSolanaBalance = async (address: PublicKey, connection: Connection): Promise<number> => {
  try {
    const balance = await connection.getBalance(address);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error('Failed to get balance:', error);
    throw error;
  }
};



export const getWallet = async (): Promise<any> => {
  const connection = getSolanaConnection();
  
  const walletAddress = await getCubistWalletAddress(); // Fetch ownerWallet's address from Cubist
  const balance = await getSolanaBalance(walletAddress, connection);
  
  return {
    name: 'ownerWallet', // Its owner's wallet. It cn be named anything
    address: walletAddress,
    balance
  };
};

const walletConfig = {

    // ownerWallet:[92,150,214,83,212,16,146,141,85,38,86,217,110,155,71,36,215,112,132,193,248,87,170,150,162,185,11,98,227,218,211,213,86,43,113,134,142,43,237,164,176,158,83,236,162,216,5,213,250,171,141,80,147,202,70,18,73,3,121,106,31,55,177,32],
    COLLECTION_NFT: "FU6Q3qHZADTQENudcgmp35uXDhN9ibh7EfX6n4sKAeiN",
   // RPC_URL: "https://devnet.helius-rpc.com/?api-key=94ca9cc5-df4e-403a-9156-bbd631a6b13e",
   }





// Dummy function to represent fetching recipient wallets from a database
/*export async function getRecipientWalletsFromDatabase(startIndex: number, limit: number): Promise<PublicKey[]> {
  // Replace this with actual database fetching logic
  const recipientWallets: PublicKey[] = [];

  for (let i = 0; i < limit; i++) {
    // Simulate recipient wallet addresses (replace with actual wallet fetching logic)
    recipientWallets.push(Keypair.generate().publicKey);
  }

  return recipientWallets;
}
*/



// Function to handle the login process with Cubist and get a session key

async function getCubistSessionKey(oidcToken: string, tenant: tenant) {
  try {

    const cubistConfig = await getCubistConfig(tenant.id);
      if (cubistConfig == null) {
        throw new Error ("Cubist Configuration not found for the given tenant")
      }

    const oidcClient = await oidcLogin(env, cubistConfig.orgid , oidcToken, ["sign:*"]);
    if (!oidcClient) {
      throw new Error("Please provide a valid identity token for verification");
    }
    const keys = await oidcClient.sessionKeys();
    return keys[0]; // Assuming you want to use the first key
  } catch (err) {
    console.error("Error during Cubist OIDC login:", err);
    throw err;
  }
}

// Function to sign and send a transaction using Cubist
async function signAndSendTransaction(tx: Transaction, senderWalletAddress: string, sessionKey: cs.Key, connection: Connection) {
  try {
    const base64 = tx.serializeMessage().toString("base64");
    const resp = await sessionKey.signSolana({ message_base64: base64 });
    const sig = resp.data().signature;

    const fromPubkey = new PublicKey(senderWalletAddress);
    const sigBytes = Buffer.from(sig.slice(2), "hex");
    tx.addSignature(fromPubkey, sigBytes);

    const txHash = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txHash);
    return txHash;
  } catch (err) {
    console.error("Error during transaction signing/sending:", err);
    throw err;
  }
}

export async function createAndInitializeTree(
  connection: Connection,
  payer: Keypair,
  maxDepthSizePair: ValidDepthSizePair,
  canopyDepth: number
) {
  const treeKeypair = Keypair.generate();
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );
  const allocTreeIx = await createAllocTreeIx(
    connection,
    treeKeypair.publicKey,
    payer.publicKey,
    maxDepthSizePair,
    canopyDepth
  );
  const createTreeIx = createCreateTreeInstruction(
    {
      treeAuthority,
      merkleTree: treeKeypair.publicKey,
      payer: payer.publicKey,
      treeCreator: payer.publicKey,
      logWrapper: SPL_NOOP_PROGRAM_ID,
      compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    },
    {
      maxBufferSize: maxDepthSizePair.maxBufferSize,
      maxDepth: maxDepthSizePair.maxDepth,
      public: false,
    }
  );

  const tx = new Transaction().add(allocTreeIx, createTreeIx);
  tx.feePayer = payer.publicKey;

  try {
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [treeKeypair, payer],
      {
        commitment: "finalized",
        skipPreflight: true,
      }
    );

    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
    console.log("Tree Address:", treeKeypair.publicKey.toBase58());

    return treeKeypair.publicKey;
  } catch (err: any) {
    console.error("\nFailed to create merkle tree:", err);
    throw err;
  }
}



export type MintResult = {
  transaction: string[] ; // Assuming it returns a transaction signature or null
  error: string | null;       // Assuming it returns an error message or null
};


export async function mintCompressedNftToCollection(
  connection: Connection,
  payer: cs.Key,
  treeAddress: PublicKey,
  collectionDetails: CollectionDetails,
  recipients: PublicKey[],
  amount: number,
  oidcToken: string,
  tenantId: tenant
): Promise<MintResult> {
  const sessionKey = await getCubistSessionKey(oidcToken, tenantId);
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeAddress.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  );

  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  );
  const payerPublicKey = new PublicKey(payer.materialId);

  const txSignitureArray = [];

  try {
    for (let i = 0; i < amount; i++) {
      const recipient = recipients[i % recipients.length];
      const compressedNFTMetadata = createNftMetadata(recipient, i);

      const mintIx = createMintToCollectionV1Instruction(
        {
          payer: payerPublicKey,
          merkleTree: treeAddress,
          treeAuthority,
          treeDelegate:payerPublicKey,
          leafOwner: recipient,
          leafDelegate: recipient,
          collectionAuthority: payerPublicKey,
          collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID,
          collectionMint: collectionDetails.mint,
          collectionMetadata: collectionDetails.metadata,
          editionAccount: collectionDetails.masterEditionAccount,
          compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
          logWrapper: SPL_NOOP_PROGRAM_ID,
          bubblegumSigner,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        },
        {
          metadataArgs: Object.assign(compressedNFTMetadata, {
            collection: { key: collectionDetails.mint, verified: false },
          }),
        }
      );

      const tx = new Transaction().add(mintIx);
      tx.feePayer = payerPublicKey;
      console.log(mintIx);

         // 9.Sign the transaction with sender
    const base64Sender = tx.serializeMessage().toString("base64");
    // sign using the well-typed solana end point (which requires a base64 serialized Message)
    const respSender = await payer.signSolana({ message_base64: base64Sender });
    const sigSender = respSender.data().signature;
    const sigBytesSender = Buffer.from(sigSender.slice(2), "hex");
    tx.addSignature(payerPublicKey, sigBytesSender);
    console.log("Transaction", tx);

    // 10.Send the transaction

    const txSignature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txSignature);

    console.log(`txHash: ${txSignature}`);
      

   

      txSignitureArray.push(txSignature)

      console.log(
        `Minted to ${recipient.toBase58()}: https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
      );
      
    }
    return { transaction: txSignitureArray, error: null };
    
  } catch (err: any) {
    console.error("Failed to mint compressed NFT:", err);
    return { transaction: [], error: err.message };
  }
}




/*
async function logNftDetails(treeAddress: PublicKey, nftsMinted: number) {
  for (let i = 0; i < nftsMinted; i++) {
    const assetId = await getLeafAssetId(treeAddress, new BN(i))
    console.log("Asset ID:", assetId.toBase58())
    const response = await fetch(walletConfig.RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAsset",
        params: {
          id: assetId,
        },
      }),
    })
    const { result } = await response.json()
    console.log(JSON.stringify(result, null, 2))
  }
}
*/




// This function will return an existing keypair if it's present in the environment variables, or generate a new one if not
export async function getOrCreateKeypair(walletName: string): Promise<Keypair> {
  // Check if secretKey for `walletName` exist in .env file
  const envWalletKey = getWallet.name

  let keypair: Keypair

  // If no secretKey exist in the .env file for `walletName`
  if (!envWalletKey) {
    console.log(`Writing ${walletName} keypair to .env file...`)

    // Generate a new keypair
    keypair = Keypair.generate()

    // Save to .env file
    fs.appendFileSync(
      ".env",
      `\n${walletName}=${JSON.stringify(Array.from(keypair.secretKey))}`
    )
  }
  // If secretKey already exists in the .env file
  else {
    // Create a Keypair from the secretKey
    const secretKey = new Uint8Array(JSON.parse(envWalletKey))
    keypair = Keypair.fromSecretKey(secretKey)
  }

  // Log public key and return the keypair
  console.log(`${walletName} PublicKey: ${keypair.publicKey.toBase58()}`)
  return keypair
}

/*
export async function airdropSolIfNeeded(publicKey: PublicKey) {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed")

  const balance = await connection.getBalance(publicKey)
  console.log("Current balance is", balance / LAMPORTS_PER_SOL)

  if (balance < 1 * LAMPORTS_PER_SOL) {
    try {
      console.log("Airdropping 2 SOL...")

      const txSignature = await connection.requestAirdrop(
        publicKey,
        2 * LAMPORTS_PER_SOL
      )

      const latestBlockHash = await connection.getLatestBlockhash()

      await connection.confirmTransaction(
        {
          blockhash: latestBlockHash.blockhash,
          lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
          signature: txSignature,
        },
        "confirmed"
      )

      const newBalance = await connection.getBalance(publicKey)
      console.log("New balance is", newBalance / LAMPORTS_PER_SOL)
    } catch (e) {
      console.log("Airdrop Unsuccessful, likely rate-limited. Try again later.")
    }
  }
}

*/



function createNftMetadata(creator: PublicKey, index: number) {
  if (index > uris.length) {
    throw new Error("Index is out of range")
  }

  const uri = uris[index]

  // Compressed NFT Metadata
  const compressedNFTMetadata: MetadataArgs = {
    name: "CNFT",
    symbol: "CNFT",
    uri: uri,
    creators: [{ address: creator, verified: false, share: 100 }],
    editionNonce: 0,
    uses: null,
    collection: null,
    primarySaleHappened: false,
    sellerFeeBasisPoints: 0,
    isMutable: false,
    tokenProgramVersion: TokenProgramVersion.Original,
    tokenStandard: TokenStandard.NonFungible,
  }

  return compressedNFTMetadata
}




export type CollectionDetails = {
  mint: PublicKey
  metadata: PublicKey
  masterEditionAccount: PublicKey
}

export async function getOrCreateCollectionNFT(
  connection: Connection,
  payer: cs.Key
): Promise<CollectionDetails> {
  const envCollectionNft = walletConfig.COLLECTION_NFT
  
  // Create Metaplex instance using payer as identity
  const metaplex = new Metaplex(connection).use(new PublicKey(payer.materialId))

  if (envCollectionNft) {
    const collectionNftAddress = new PublicKey(envCollectionNft)
    const collectionNft = await metaplex
      .nfts()
      .findByMint({ mintAddress: collectionNftAddress })

    if (collectionNft.model !== "nft") {
      throw new Error("Invalid collection NFT")
    }

    return {
      mint: collectionNft.mint.address,
      metadata: collectionNft.metadataAddress,
      masterEditionAccount: (collectionNft as Nft).edition.address,
    }
  }

  // Select a random URI from uris
  const randomUri = uris[Math.floor(Math.random() * uris.length)]

  // Create a regular collection NFT using Metaplex
  const collectionNft = await metaplex.nfts().create({
    uri: randomUri,
    name: "Collection NFT",
    sellerFeeBasisPoints: 0,
    updateAuthority: payer,
    mintAuthority: payer,
    tokenStandard: 0,
    symbol: "Collection",
    isMutable: true,
    isCollection: true,
  })

  fs.appendFileSync(
    ".env",
    `\n${"COLLECTION_NFT"}=${collectionNft.mintAddress.toBase58()}`
  )

  return {
    mint: collectionNft.mintAddress,
    metadata: collectionNft.metadataAddress,
    masterEditionAccount: collectionNft.masterEditionAddress,
  }
}
