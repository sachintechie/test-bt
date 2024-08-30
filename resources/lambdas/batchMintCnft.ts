import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getOrCreateKeypair, getOrCreateCollectionNFT, mintCompressedNftToCollection, MintResult } from "../solana/cNft/commonFunctions";
import { tenant } from "../db/models";

// Define your handler function
export const handler = async (event: any) => {
  try {
    // Parse the JSON body from the event
    const body = JSON.parse(event.body || '{}');
    
    // Extract parameters from the parsed body
    const senderWalletAddress = body.input?.senderWalletAddress  as string | undefined;;
    const receiverWalletAddress = body.input?.receiverWalletAddress  as string | undefined;;
    const amount = body.input?.amount || 1; // Default to 1 if amount is not provided
    const oidcToken = event.headers?.identity;
    const tenantId = event.identity.resolverContext as tenant

    // Validate required fields
    if (!senderWalletAddress || !receiverWalletAddress) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing required fields" }),
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
        error: data.error,
      }),
    };
  } catch (error: any) {
    console.error("Error executing mintCompressedNftToCollection:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
        error: error.message,
      }),
    };
  }
};
