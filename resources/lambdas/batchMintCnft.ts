import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import { mintCompressedNftToCollection, MintResult, airdropSolToWallets, initializeTokenAccounts, airdropTokens } from "../solana/cNft/commonFunctions";
import { tenant } from "../db/models";
import { getSolConnection } from "../solana/solanaFunctions";
import { getPayerCsSignerKey } from "../cubist/CubeSignerClient";
import { delay } from "@cubist-labs/cubesigner-sdk";

// Define your handler function
export const handler = async (event: any) => {
  try {

    // Extract parameters from the parsed body


    const receiverWalletAddress = event.arguments?.input?.receiverWalletAddress;
    const amount = event.arguments?.input?.amount || 1; // Default to 1 if amount is not provided
    const oidcToken = event.headers?.identity;
    const tenant = event.identity?.resolverContext as tenant;

    // Validate required fields
    if (!receiverWalletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" })
      };
    }
   const data = await airdropCNFT(tenant, receiverWalletAddress, amount);
    // Build the response
    return {
      statusCode: 200,
      body: JSON.stringify({
        transaction: data.transaction,
        error: data.error
      })
    };
  } catch (error: any) {
    console.error("Error executing mintCompressedNftToCollection:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message
      })
    };
  }
};

// Generate an array of dummy recipient Solana wallet addresses
function generateDummyWallets(count: number): PublicKey[] {
  const wallets: PublicKey[] = [];
  for (let i = 0; i < count; i++) {
    const newWallet = Keypair.generate();
    wallets.push(newWallet.publicKey);
  }
  return wallets;
}

async function airdropCNFT(tenant: tenant, receiver: string[], amount: number) {
  try {
    // Create a Solana connection
   // const connection = await getSolConnection();
    const connection = new Connection('https://devnet.helius-rpc.com/?api-key=94ca9cc5-df4e-403a-9156-bbd631a6b13e', 'processed');

    // Fetch the payer's keypair (or create one if it doesn't exist)
    const payer = await getPayerCsSignerKey("Solana", tenant.id);
    console.log("Payer ", payer);
    if (payer?.key == null) {
      return {
        transaction: null,
        error: "Payer Key not found for the given tenant"
      };
    }

   // const mintAddress = new PublicKey("..."); // Replace with your token mint address
   // const payer = Keypair.generate(); // The payer needs to have enough SOL to cover fees



    // Get or create the NFT collection details

   const collectionDetails = {
     mint: new PublicKey("9ZaAdtajfjeStX1jxkQiPrbt9yYGseB9tAZ8fmC799xH"),
     metadata: new PublicKey("HMj3e6Qa9i3JcyUUDpKTBRNTi5CQcAgtjx3KHowomcTn"),
     masterEditionAccount: new PublicKey("4JYBkAnG3c3KdGhqNJngh7cxMPVC5oAdvwRHLdKZEgYW"),
  }


   // const collectionDetails = await getOrCreateCollectionNFT(connection, payer.key)
   const receivers = ['BfbSjfhaD2GQ6uM3yquoDgoKrEbVPUqTZuk1McJ2K5bv','Ge18sweHd9goH6AmgMBywbfAqyb3VCQCX4KabazEMkRU','BJMqUixndJvAFDdvYyYxexfzS7zPBwnzzTVHcF6cGK7S','7swbSFJaBfNeiC7V7HU6WuUKegwR5HELywjGqE7FdrME','Hy4acbgqaZgd1SNfA5THaGHUPQbAzJko6TPmpww9mkvK']
   //let receiverList: PublicKey[] = [];
   let receiverList: PublicKey[] = generateDummyWallets(10);
   
   /*
   // Convert the receiver wallet address to a PublicKey
   receivers.map((receiver) => {
     const recipientPublicKey = new PublicKey(receiver);

     receiverList.push(recipientPublicKey);
    });
    */


    await airdropSolToWallets(connection, receiverList, 1); // Airdrops 1 SOL to each wallet
    
    //await initializeTokenAccounts(connection, payer, receiverList, mintAddress);
    //await airdropTokens(connection, payer, mintAddress, receiverList, 1000); // Airdrops 1000 tokens to each wallet
    
    

    // Mint the compressed NFT(s) to the collection
    const data: MintResult = await mintCompressedNftToCollection(
      connection,
      payer.key,
      collectionDetails.mint,
      collectionDetails,
      receiverList,
      amount,
      tenant
    );

    return data;
  } catch (error) {
    
      return { data: null, error: error };
    
  }
}