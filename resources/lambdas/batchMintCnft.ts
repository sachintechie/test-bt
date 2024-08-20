import { APIGatewayProxyHandler } from 'aws-lambda';
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
//import dotenv from "dotenv";
import { walletConfig } from "../solana/cNft/constant";

import { airdropSolIfNeeded,
  getOrCreateKeypair,
  getOrCreateCollectionNFT,
  createAndInitializeTree,
  mintCompressedNftToCollection,
  transferNft 
} from "../solana/cNft/commonFunctions"
/* import {
  createAndInitializeTree,
  mintCompressedNftToCollection,
  transferNft
  //logNftDetails // @Jayesh if Metadata is not required
} from "../solana/cNft/cNFT"; 

*/
import { getLeafAssetId } from "@metaplex-foundation/mpl-bubblegum";
import BN from 'bn.js';


// dotenv.config();

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


export const handler: APIGatewayProxyHandler = async (event: any) => {
  try {

    const body = event.arguments?.input;
    const recepientWallet = body?.recepientWallet;
    

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
   // const wallet = await getOrCreateKeypair("Wallet_1");
    const wallet = await getOrCreateKeypair(walletConfig.Wallet_1);
    await airdropSolIfNeeded(wallet.publicKey);

    const maxDepthSizePair = {
      maxDepth: 14 as 14,  // Allows for up to 64 NFTs
      maxBufferSize: 64 as 64,
    };

    const canopyDepth = 0;

    const treeAddress = await createAndInitializeTree(
      connection,
      wallet,
      maxDepthSizePair,
      canopyDepth
    );

    const collectionNft = await getOrCreateCollectionNFT(connection, wallet);

    await mintCompressedNftToCollection(
      connection,
      wallet,
      treeAddress,
      collectionNft,
      50
    );

    for (let i = 0; i < 50; i++) {
      const recipientWallet = await getOrCreateKeypair(recepientWallet[i]);
      await airdropSolIfNeeded(recipientWallet.publicKey);

      const assetId = await getLeafAssetId(treeAddress, new BN(i));
      console.log(`Transferring NFT asset: ${assetId.toString()} from sender's wallet: ${wallet.publicKey.toString()} to recipient's Wallet: ${recipientWallet.publicKey.toString()}`);

      await transferNft(connection, assetId, wallet, recipientWallet.publicKey);
    }

    console.log("All 50 NFTs are transferred successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "NFT operations completed successfully!" }),
    };
  } catch (error) {
    console.error("Error during NFT operations:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "An error occurred", error: error.message }),
    };
  }
};



  
