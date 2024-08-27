import {
    Connection,
    PublicKey,
    PublicKeyInitData,
    clusterApiUrl
  } from "@solana/web3.js";
  import {
    
    ValidDepthSizePair
  } from "@solana/spl-account-compression";

  import {createAndInitializeTree, mintCompressedNftToCollection, getOrCreateKeypair, airdropSolIfNeeded, getOrCreateCollectionNFT } from "../solana/cNft/commonFunctions"



  
  
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
    const recipients = event.recipients.map((addr: PublicKeyInitData) => new PublicKey(addr));
  
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