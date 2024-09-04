import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getOrCreateKeypair, getOrCreateCollectionNFT, mintCompressedNftToCollection, MintResult, createAndInitializeTree, generateDummyWallets } from "../solana/cNft/commonFunctions";
import { tenant } from "../db/models";

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

    // Create a Solana connection
    const connection = new Connection(clusterApiUrl("mainnet-beta"));

    // Fetch the payer's keypair (or create one if it doesn't exist)
    const payer = await getOrCreateKeypair("payerWallet");

    // Get or create the NFT collection details
    const collectionDetails = await getOrCreateCollectionNFT(connection, payer);

    // Convert the receiver wallet address to a PublicKey
    const recipientPublicKey = new PublicKey(receiverWalletAddress);

    // Mint the compressed NFT(s) to the collection
    const data: MintResult = await mintCompressedNftToCollection(
      connection,
      payer,
      collectionDetails.mint,
      collectionDetails,
      [recipientPublicKey], // Single recipient; can be expanded to a list
      amount,
      oidcToken,
      tenantId
    );

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

async function airdropCNFT(tenant: tenant, receivers: string[], amount: number, oidcToken: string) {
  try {
    // Create a Solana connection
    const connection = await getSolConnection();

    // Fetch the payer's keypair (or create one if it doesn't exist)
    const payer = await getPayerCsSignerKey("Solana", tenant.id);
    console.log("Payer", payer);
    if (payer?.key == null) {
      return {
        transaction: null,
        error: "Payer Key not found for the given tenant"
      };
    }

    // Get or create the NFT collection details
    const collectionDetails = {
      mint: new PublicKey("collectionNft.mintAddress"),
      metadata: new PublicKey("collectionNft.metadataAddress"),
      masterEditionAccount: new PublicKey("collectionNft.masterEditionAddress"),
    }

   let receiverList: PublicKey[] = [];
    // Convert the receiver wallet address to a PublicKey
    receivers.map((receiver) => {
      const recipientPublicKey = new PublicKey(receiver);
      receiverList.push(recipientPublicKey);
    });

    // Mint the compressed NFT(s) to the collection
    const data: MintResult = await mintCompressedNftToCollection(
      connection,
      payer.key,
      collectionDetails.mint,
      collectionDetails,
      receiverList,
      amount,
      oidcToken,
      tenant
    );

    return data;
  } catch (error) {
    
      return { data: null, error: error };
    
  }
}
