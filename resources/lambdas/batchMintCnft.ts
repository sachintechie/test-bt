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

  import {createAndInitializeTree, batchTransferNfts, mintCompressedNftToCollection, getOrCreateKeypair, airdropSolIfNeeded, getOrCreateCollectionNFT } from "../solana/cNft/commonFunctions"

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
  
  
  export const handler = async (event: any) => {
    try {
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      const wallet = await getOrCreateKeypair("Wallet_1");
      await airdropSolIfNeeded(wallet.publicKey);
  
      const maxDepthSizePair: ValidDepthSizePair = {
        maxDepth: 20,
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
        1000000 
      );
  
      await batchTransferNfts(
        connection,
        wallet,
        treeAddress,
        1000000,
        batchSize
      );
  
      return {
        statusCode: 200,
        body: JSON.stringify("NFT minting and transfer complete"),
      };
    } catch (error) {
      console.error("Error during Lambda execution", error);
      return {
        statusCode: 500,
        body: JSON.stringify("An error occurred"),
      };
    }
  };
  