import fetch from "node-fetch"
import {
  AccountMeta,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  clusterApiUrl,
  sendAndConfirmTransaction,
  SystemProgram
} from "@solana/web3.js"

import * as fs from "fs"


import {
  SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
  ValidDepthSizePair,
  createAllocTreeIx,
  SPL_NOOP_PROGRAM_ID,
  ConcurrentMerkleTreeAccount,
} from "@solana/spl-account-compression"

import {
  PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
  createCreateTreeInstruction,
  createMintToCollectionV1Instruction,
  createTransferInstruction,
  getLeafAssetId,
  MetadataArgs,
  TokenProgramVersion,
  TokenStandard
} from "@metaplex-foundation/mpl-bubblegum"

import { uris } from "./uri"
import { Metaplex, Nft, keypairIdentity } from "@metaplex-foundation/js"


import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
import { BN } from "@project-serum/anchor"


const walletConfig = {

    Wallet_1:[92,150,214,83,212,16,146,141,85,38,86,217,110,155,71,36,215,112,132,193,248,87,170,150,162,185,11,98,227,218,211,213,86,43,113,134,142,43,237,164,176,158,83,236,162,216,5,213,250,171,141,80,147,202,70,18,73,3,121,106,31,55,177,32],
    COLLECTION_NFT: "FU6Q3qHZADTQENudcgmp35uXDhN9ibh7EfX6n4sKAeiN",
    RPC_URL: "https://devnet.helius-rpc.com/?api-key=94ca9cc5-df4e-403a-9156-bbd631a6b13e",
    //Wallet_2: [239,29,40,216,104,181,31,231,217,41,11,55,223,113,196,3,170,184,152,198,132,6,45,188,193,80,133,144,173,92,20,82,202,43,104,46,201,210,67,21,152,22,114,143,231,149,160,243,39,61,177,92,55,146,38,213,54,193,55,72,103,226,167,146],
   // Wallet_3: [116,156,194,71,188,26,234,1,37,146,51,10,80,109,5,230,222,185,187,230,7,233,118,123,158,139,133,68,61,208,234,249,125,242,15,172,96,78,221,115,189,158,184,25,108,182,250,55,140,98,106,197,76,216,127,146,145,191,27,194,176,73,247,68],
   // Wallet_4: [21,15,184,78,45,111,232,96,206,138,56,64,89,58,119,132,179,105,139,2,254,60,130,138,243,132,244,210,195,171,172,13,182,135,139,60,177,159,230,4,57,253,51,213,26,155,181,72,176,144,130,136,29,121,238,185,239,2,55,71,51,181,29,137],
  //  Wallet_5: [114,249,163,66,57,209,88,13,212,57,22,251,95,169,147,191,96,245,7,235,36,84,94,251,69,6,212,203,31,37,74,136,215,17,85,41,136,237,164,33,68,95,64,159,126,171,99,57,97,79,128,21,135,178,27,31,253,109,49,233,242,251,4,126],
   // Wallet_6: [134,99,72,180,31,247,143,50,151,126,118,180,182,73,91,38,30,189,8,96,95,82,18,159,252,64,110,160,201,10,45,96,157,225,78,114,155,93,125,239,203,150,125,30,41,169,185,174,65,127,157,164,58,119,222,89,68,147,105,123,246,114,96,62],
  //  Wallet_7: [11,177,239,239,147,194,69,40,51,225,106,229,223,203,203,197,3,89,73,77,130,186,217,195,6,147,183,194,113,98,85,113,230,32,30,165,197,189,3,166,177,174,182,245,48,65,29,93,155,57,166,25,125,20,160,112,90,26,18,225,213,178,226,27]
    }

/*
async function main() {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = await getOrCreateKeypair("Wallet_1");
  await airdropSolIfNeeded(wallet.publicKey);

  const maxDepthSizePair: ValidDepthSizePair = {
    maxDepth: 20, // Sufficient to handle 1 million NFTs (2^20 = 1,048,576)
    maxBufferSize: 256,
  };

  const canopyDepth = 0;

  const treeAddress = await createAndInitializeTree(
    connection,
    wallet,
    maxDepthSizePair,
    canopyDepth
  );

  const collectionNft = await getOrCreateCollectionNFT(connection, wallet);

  const batchSize = 5000;

  await mintCompressedNftToCollection(
    connection,
    wallet,
    treeAddress,
    collectionNft,
    1000000, // Total number of NFTs to mint
    
  );

  // Fetch recipient wallets in batches and transfer NFTs
  await batchTransferNfts(
    connection,
    wallet,
    treeAddress,
    1000000, // Total number of NFTs to transfer
    batchSize
  );
}
*/
export async function batchTransferNfts(
  connection: Connection,
  sender: Keypair,
  treeAddress: PublicKey,
  totalAmount: number,
  batchSize: number
) {
  for (let i = 0; i < totalAmount; i += batchSize) {
    const batchEnd = Math.min(i + batchSize, totalAmount);
    const currentBatchSize = batchEnd - i;

    // Retrieve recipient wallets from the database for the current batch
    const recipientWallets = await getRecipientWalletsFromDatabase(i, currentBatchSize);

    console.log(`Transferring NFTs ${i + 1} to ${batchEnd}...`);

    await transferNftBatch(
      connection,
      sender,
      treeAddress,
      i,
      recipientWallets
    );
  }
}

async function transferNftBatch(
  connection: Connection,
  sender: Keypair,
  treeAddress: PublicKey,
  startIndex: number,
  recipientWallets: PublicKey[]
) {
  for (let i = 0; i < recipientWallets.length; i++) {
    const assetId = await getLeafAssetId(treeAddress, new BN(startIndex + i));
    const receiver = recipientWallets[i];

    await transferNft(connection, assetId, sender, receiver);
  }
}


// Dummy function to represent fetching recipient wallets from a database
export async function getRecipientWalletsFromDatabase(startIndex: number, limit: number): Promise<PublicKey[]> {
  // Replace this with actual database fetching logic
  const recipientWallets: PublicKey[] = [];

  for (let i = 0; i < limit; i++) {
    // Simulate recipient wallet addresses (replace with actual wallet fetching logic)
    recipientWallets.push(Keypair.generate().publicKey);
  }

  return recipientWallets;
}




// main()

export async function createAndInitializeTree(
  connection: Connection,
  payer: Keypair,
  maxDepthSizePair: ValidDepthSizePair,
  canopyDepth: number
) {
  const treeKeypair = Keypair.generate()
  const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
    [treeKeypair.publicKey.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )
  const allocTreeIx = await createAllocTreeIx(
    connection,
    treeKeypair.publicKey,
    payer.publicKey,
    maxDepthSizePair,
    canopyDepth
  )
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
  )

  const tx = new Transaction().add(allocTreeIx, createTreeIx)
  tx.feePayer = payer.publicKey

  try {
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [treeKeypair, payer],
      {
        commitment: "finalized",
        skipPreflight: true,
      }
    )

    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)

    console.log("Tree Address:", treeKeypair.publicKey.toBase58())

    return treeKeypair.publicKey
  } catch (err: any) {
    console.error("\nFailed to create merkle tree:", err)
    throw err
  }
}

export async function mintCompressedNftToCollection(
  connection: Connection,
  payer: Keypair,
  treeAddress: PublicKey,
  collectionDetails: CollectionDetails,
  amount: number
) {
  // Derive the tree authority PDA ('TreeConfig' account for the tree account)
  const [treeAuthority] = PublicKey.findProgramAddressSync(
    [treeAddress.toBuffer()],
    BUBBLEGUM_PROGRAM_ID
  )

  // Derive the bubblegum signer, used by the Bubblegum program to handle "collection verification"
  // Only used for `createMintToCollectionV1` instruction
  const [bubblegumSigner] = PublicKey.findProgramAddressSync(
    [Buffer.from("collection_cpi", "utf8")],
    BUBBLEGUM_PROGRAM_ID
  )

  for (let i = 0; i < amount; i++) {
    // Compressed NFT Metadata
    const compressedNFTMetadata = createNftMetadata(payer.publicKey, i)

    // Create the instruction to "mint" the compressed NFT to the tree
    const mintIx = createMintToCollectionV1Instruction(
      {
        payer: payer.publicKey, // The account that will pay for the transaction
        merkleTree: treeAddress, // The address of the tree account
        treeAuthority, // The authority of the tree account, should be a PDA derived from the tree account address
        treeDelegate: payer.publicKey, // The delegate of the tree account, should be the same as the tree creator by default
        leafOwner: payer.publicKey, // The owner of the compressed NFT being minted to the tree
        leafDelegate: payer.publicKey, // The delegate of the compressed NFT being minted to the tree
        collectionAuthority: payer.publicKey, // The authority of the "collection" NFT
        collectionAuthorityRecordPda: BUBBLEGUM_PROGRAM_ID, // Must be the Bubblegum program id
        collectionMint: collectionDetails.mint, // The mint of the "collection" NFT
        collectionMetadata: collectionDetails.metadata, // The metadata of the "collection" NFT
        editionAccount: collectionDetails.masterEditionAccount, // The master edition of the "collection" NFT
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
    )

    try {
      // Create new transaction and add the instruction
      const tx = new Transaction().add(mintIx)

      // Set the fee payer for the transaction
      tx.feePayer = payer.publicKey

      // Send the transaction
      const txSignature = await sendAndConfirmTransaction(
        connection,
        tx,
        [payer],
        { commitment: "finalized", skipPreflight: true }
      )

      console.log(
        `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`
      )
    } catch (err) {
      console.error("\nFailed to mint compressed NFT:", err)
      throw err
    }
  }
}

/*
async function logNftDetails(treeAddress: PublicKey, nftsMinted: number) {
  for (let i = 0; i < nftsMinted; i++) {
    const assetId = await getLeafAssetId(treeAddress, new BN(i))
    console.log("Asset ID:", assetId.toBase58())
    const response = await fetch(process.env.RPC_URL, {
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

async function transferNft(
  connection: Connection,
  assetId: PublicKey,
  sender: Keypair,
  receiver: PublicKey
) {
  try {
    const assetDataResponse = await fetch(process.env.RPC_URL, {
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
    const assetData = (await assetDataResponse.json()).result

    const assetProofResponse = await fetch(process.env.RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "my-id",
        method: "getAssetProof",
        params: {
          id: assetId,
        },
      }),
    })
    const assetProof = (await assetProofResponse.json()).result

    const treePublicKey = new PublicKey(assetData.compression.tree)

    const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
      connection,
      treePublicKey
    )

    const canopyDepth = treeAccount.getCanopyDepth() || 0

    const proofPath: AccountMeta[] = assetProof.proof
      .map((node: string) => ({
        pubkey: new PublicKey(node),
        isSigner: false,
        isWritable: false,
      }))
      .slice(0, assetProof.proof.length - canopyDepth)

    const treeAuthority = treeAccount.getAuthority()
    const leafOwner = new PublicKey(assetData.ownership.owner)
    const leafDelegate = assetData.ownership.delegate
      ? new PublicKey(assetData.ownership.delegate)
      : leafOwner

    const transferIx = createTransferInstruction(
      {
        merkleTree: treePublicKey,
        treeAuthority,
        leafOwner,
        leafDelegate,
        newLeafOwner: receiver,
        logWrapper: SPL_NOOP_PROGRAM_ID,
        compressionProgram: SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
        anchorRemainingAccounts: proofPath,
      },
      {
        root: [...new PublicKey(assetProof.root.trim()).toBytes()],
        dataHash: [
          ...new PublicKey(assetData.compression.data_hash.trim()).toBytes(),
        ],
        creatorHash: [
          ...new PublicKey(assetData.compression.creator_hash.trim()).toBytes(),
        ],
        nonce: assetData.compression.leaf_id,
        index: assetData.compression.leaf_id,
      }
    )

    const tx = new Transaction().add(transferIx)
    tx.feePayer = sender.publicKey
    const txSignature = await sendAndConfirmTransaction(
      connection,
      tx,
      [sender],
      {
        commitment: "confirmed",
        skipPreflight: true,
      }
    )
    console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
  } catch (err: any) {
    console.error("\nFailed to transfer nft:", err)
    throw err
  }
}


// This function will return an existing keypair if it's present in the environment variables, or generate a new one if not
export async function getOrCreateKeypair(walletName: string): Promise<Keypair> {
  // Check if secretKey for `walletName` exist in .env file
  const envWalletKey = process.env[walletName]

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
  payer: Keypair
): Promise<CollectionDetails> {
  const envCollectionNft = process.env["COLLECTION_NFT"]

  // Create Metaplex instance using payer as identity
  const metaplex = new Metaplex(connection).use(keypairIdentity(payer))

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
