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
  } from "@solana/web3.js";
  import * as fs from "fs";
  import {
    SPL_ACCOUNT_COMPRESSION_PROGRAM_ID,
    ValidDepthSizePair,
    createAllocTreeIx,
    SPL_NOOP_PROGRAM_ID,
    ConcurrentMerkleTreeAccount,
  } from "@solana/spl-account-compression";

  import {createAndInitializeTree, getRecipientWalletsFromDatabase, mintCompressedNftToCollection, getOrCreateKeypair, airdropSolIfNeeded, getOrCreateCollectionNFT } from "../solana/cNft/commonFunctions"

  import {
    PROGRAM_ID as BUBBLEGUM_PROGRAM_ID,
    createCreateTreeInstruction,
    createMintToCollectionV1Instruction,
    createTransferInstruction,
    getLeafAssetId,
    MetadataArgs,
    TokenProgramVersion,
    TokenStandard
  } from "@metaplex-foundation/mpl-bubblegum";
  import { uris } from "./uri";
  import { Metaplex, Nft, keypairIdentity } from "@metaplex-foundation/js";
  import { PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
  import { BN } from "@project-serum/anchor";
  import { Lambda } from "aws-sdk";
  
  
exports.handler = async (event: any) => {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const wallet = await getOrCreateKeypair("Wallet_1");
    await airdropSolIfNeeded(wallet.publicKey);
  
    const maxDepthSizePair: ValidDepthSizePair = {
      maxDepth: 20, // Adjusted for larger capacity
      maxBufferSize: 64, // Adjusted for larger capacity = 1 Millpion
    };
  
    const canopyDepth = 0;
  
    const treeAddress = await createAndInitializeTree(
      connection,
      wallet,
      maxDepthSizePair,
      canopyDepth
    );
  
    const collectionNft = await getOrCreateCollectionNFT(connection, wallet);
  
    // Assuming you've retrieved recipient addresses from  event input
    const recipients = event.recipients.map(addr => new PublicKey(addr));
  
    await mintCompressedNftToCollection(
      connection,
      wallet,
      treeAddress,
      collectionNft,
      recipients, // Pass the array of recipient addresses
      recipients.length // Pass the number of NFTs to mint, equal to the number of recipients
    );
  
    return {
      statusCode: 200,
      body: JSON.stringify('NFTs Minted Successfully!'),
    };
  };