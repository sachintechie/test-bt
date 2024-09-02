import { APIGatewayProxyHandler } from 'aws-lambda';
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { getOrCreateKeypair, getOrCreateCollectionNFT, mintCompressedNftToCollection, MintResult, createAndInitializeTree, generateDummyWallets } from "../solana/cNft/commonFunctions";
import { tenant } from "../db/models";
import { ValidDepthSizePair } from '@solana/spl-account-compression';

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

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed")
    const wallet = await getOrCreateKeypair(senderWalletAddress)
    // airdropSolIfNeeded(wallet.publicKey)

  const maxDepthSizePair: ValidDepthSizePair = {
    maxDepth: 3,
    maxBufferSize: 8,
  };
 
  const canopyDepth = 0;
 
  const treeAddress = await createAndInitializeTree(
    connection,
    wallet,
    maxDepthSizePair,
    canopyDepth,
  );


  const collectionNft = await getOrCreateCollectionNFT(connection, wallet);

  // Generate dummy recipient wallets
  const recipientWallets = generateDummyWallets(10); // Generate 10 dummy wallets
  
  console.log(wallet);
  
  const data = await mintCompressedNftToCollection(
    connection,
    wallet,
    treeAddress,
    collectionNft,
    recipientWallets,
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
