import {
    AccountMeta,
    Connection,
    Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    clusterApiUrl,
  } from "@solana/web3.js"
  
  import * as fs from "fs"
  import {
    SystemProgram,
    Transaction,
    sendAndConfirmTransaction,
  } from "@solana/web3.js"
  import {
    MetadataArgs,
    TokenProgramVersion,
    TokenStandard,
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
    createCreateTreeInstruction,
    createMintToCollectionV1Instruction,
    createTransferInstruction,
    getLeafAssetId,
  } from "@metaplex-foundation/mpl-bubblegum"

import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"
  
import { Metaplex, Nft, keypairIdentity } from "@metaplex-foundation/js"
import { uris } from "./uri"
import { ConcurrentMerkleTreeAccount, createAllocTreeIx, SPL_ACCOUNT_COMPRESSION_PROGRAM_ID, SPL_NOOP_PROGRAM_ID, ValidDepthSizePair } from "@solana/spl-account-compression"
  

const walletConfig = {

    // Wallet_1:[92,150,214,83,212,16,146,141,85,38,86,217,110,155,71,36,215,112,132,193,248,87,170,150,162,185,11,98,227,218,211,213,86,43,113,134,142,43,237,164,176,158,83,236,162,216,5,213,250,171,141,80,147,202,70,18,73,3,121,106,31,55,177,32],
    COLLECTION_NFT: "FU6Q3qHZADTQENudcgmp35uXDhN9ibh7EfX6n4sKAeiN",
    RPC_URL: "https://devnet.helius-rpc.com/?api-key=94ca9cc5-df4e-403a-9156-bbd631a6b13e",
    }

  // This function will return an existing keypair if it's present in the environment variables, or generate a new one if not
  export async function getOrCreateKeypair(walletName: number[]): Promise<Keypair> {
    // Check if secretKey for `walletName` exist in .env file
    // const envWalletKey = process.env[walletName]
    const envWalletKey = walletName
  
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
      const secretKey = new Uint8Array(envWalletKey)
      keypair = Keypair.fromSecretKey(secretKey)
    }
  
    // Log public key and return the keypair
    console.log(`${walletName} PublicKey: ${keypair.publicKey.toBase58()}`)
    return keypair
  }
  
  export async function airdropSolIfNeeded(publicKey: PublicKey) {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
    const balance = await connection.getBalance(publicKey);
    console.log("Current balance is", balance / LAMPORTS_PER_SOL);
  
    if (balance < 1 * LAMPORTS_PER_SOL) {
      let success = false;
      let attempt = 0;
      const maxRetries = 5; // Max number of retries
      let delay = 1000; // Initial delay of 1 second
  
      while (!success && attempt < maxRetries) {
        try {
          console.log(`Airdropping 2 SOL... (Attempt ${attempt + 1})`);
  
          const txSignature = await connection.requestAirdrop(
            publicKey,
            2 * LAMPORTS_PER_SOL
          );
  
          const latestBlockHash = await connection.getLatestBlockhash();
  
          await connection.confirmTransaction(
            {
              blockhash: latestBlockHash.blockhash,
              lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
              signature: txSignature,
            },
            "confirmed"
          );
  
          const newBalance = await connection.getBalance(publicKey);
          console.log("New balance is", newBalance / LAMPORTS_PER_SOL);
          success = true; // Set success to true to exit the loop
        } catch (e) {
          console.log(
            `Airdrop Unsuccessful, likely rate-limited. Retrying in ${delay / 1000} seconds...`
          );
  
          attempt++;
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2; // Exponentially increase the delay
        }
      }
  
      if (!success) {
        console.log(
          "Airdrop failed after multiple attempts. Please try again later."
        );
      }
    }
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
  
  export async function transferSolIfNeeded(sender: Keypair, receiver: Keypair) {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
  
    const balance = await connection.getBalance(receiver.publicKey)
    console.log("Current balance is", balance / LAMPORTS_PER_SOL)
  
    if (balance < 0.5 * LAMPORTS_PER_SOL) {
      try {
        let ix = SystemProgram.transfer({
          fromPubkey: sender.publicKey,
          toPubkey: receiver.publicKey,
          lamports: LAMPORTS_PER_SOL,
        })
  
        await sendAndConfirmTransaction(connection, new Transaction().add(ix), [
          sender,
        ])
  
        const newBalance = await connection.getBalance(receiver.publicKey)
        console.log("New balance is", newBalance / LAMPORTS_PER_SOL)
      } catch (e) {
        console.log("SOL Transfer Unsuccessful")
      }
    }
  }
  
  export function createNftMetadata(creator: PublicKey, index: number) {
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
    const envCollectionNft = walletConfig.COLLECTION_NFT
  
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
  
    /*fs.appendFileSync(
      ".env",
      `\n${"COLLECTION_NFT"}=${collectionNft.mintAddress.toBase58()}`
      */

      // Does secret key manager gets updated ?
      walletConfig.COLLECTION_NFT = collectionNft.mintAddress.toBase58()

  
    return {
      mint: collectionNft.mintAddress,
      metadata: collectionNft.metadataAddress,
      masterEditionAccount: collectionNft.masterEditionAddress,
    }
  }
  

  export async function createAndInitializeTree(
    connection: Connection,
    payer: Keypair,
    maxDepthSizePair: ValidDepthSizePair,
    canopyDepth: number,
  ) {
    const treeKeypair = Keypair.generate();
  
    const allocTreeIx = await createAllocTreeIx(
      connection,
      treeKeypair.publicKey,
      payer.publicKey,
      maxDepthSizePair,
      canopyDepth,
    );
  
    const [treeAuthority, _bump] = PublicKey.findProgramAddressSync(
      [treeKeypair.publicKey.toBuffer()],
      BUBBLEGUM_PROGRAM_ID,
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
      },
    );
   
    const tx = new Transaction().add(allocTreeIx, createTreeIx);
    tx.feePayer = payer.publicKey;
   
    try {
      const txSignature = await sendAndConfirmTransaction(
        connection,
        tx,
        [treeKeypair, payer],
        {
          commitment: "confirmed",
          skipPreflight: true,
        },
      );
   
      console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
   
      console.log("Tree Address:", treeKeypair.publicKey.toBase58());
   
      return treeKeypair.publicKey;
    } catch (err: any) {
      console.error("\nFailed to create Merkle tree:", err);
      throw err;
    }
  }


 //Transfer cNFT
   export async function transferNft(
    connection: Connection,
    assetId: PublicKey,
    sender: Keypair,
    receiver: PublicKey,
  ) {
    try {
      const assetDataResponse = await fetch(walletConfig.RPC_URL, {
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
      });
      const assetData = (await assetDataResponse.json()).result;
   
      const assetProofResponse = await fetch(walletConfig.RPC_URL, {
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
      });
      const assetProof = (await assetProofResponse.json()).result;
   
      const treePublicKey = new PublicKey(assetData.compression.tree);
   
      const treeAccount = await ConcurrentMerkleTreeAccount.fromAccountAddress(
        connection,
        treePublicKey,
      );
   
      const canopyDepth = treeAccount.getCanopyDepth() || 0;
   
      const proofPath: AccountMeta[] = assetProof.proof
        .map((node: string) => ({
          pubkey: new PublicKey(node),
          isSigner: false,
          isWritable: false,
        }))
        .slice(0, assetProof.proof.length - canopyDepth);
   
      const treeAuthority = treeAccount.getAuthority();
      const leafOwner = new PublicKey(assetData.ownership.owner);
      const leafDelegate = assetData.ownership.delegate
        ? new PublicKey(assetData.ownership.delegate)
        : leafOwner;
   
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
        },
      );
   
      const tx = new Transaction().add(transferIx);
      tx.feePayer = sender.publicKey;
      const txSignature = await sendAndConfirmTransaction(
        connection,
        tx,
        [sender],
        {
          commitment: "confirmed",
          skipPreflight: true,
        },
      );
      console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
    } catch (err: any) {
      console.error("\nFailed to transfer nft:", err);
      throw err;
    }
  }
  

  // Mint cNFTS to the Tree
export async function mintCompressedNftToCollection(
    connection: Connection,
    payer: Keypair,
    treeAddress: PublicKey,
    collectionDetails: CollectionDetails,
    amount: number,
  ) {
    // Derive the tree authority PDA ('TreeConfig' account for the tree account)
    const [treeAuthority] = PublicKey.findProgramAddressSync(
      [treeAddress.toBuffer()],
      BUBBLEGUM_PROGRAM_ID,
    );
   
    // Derive the bubblegum signer, used by the Bubblegum program to handle "collection verification"
    // Only used for `createMintToCollectionV1` instruction
    const [bubblegumSigner] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_cpi", "utf8")],
      BUBBLEGUM_PROGRAM_ID,
    );
   
    for (let i = 0; i < amount; i++) {
      // Compressed NFT Metadata
      const compressedNFTMetadata = createNftMetadata(payer.publicKey, i);
   
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
        },
      );
   
      try {
        // Create new transaction and add the instruction
        const tx = new Transaction().add(mintIx);
   
        // Set the fee payer for the transaction
        tx.feePayer = payer.publicKey;
   
        // Send the transaction
        const txSignature = await sendAndConfirmTransaction(
          connection,
          tx,
          [payer],
          { commitment: "confirmed", skipPreflight: true },
        );
   
        console.log(
          `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`,
        );
      } catch (err) {
        console.error("\nFailed to mint compressed NFT:", err);
        throw err;
      }
    }
  }