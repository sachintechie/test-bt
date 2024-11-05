import {transferERC1155} from "./transferERC1155";

export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId, buyerWalletAddress, mode, priceCurrencyCode, price, quantity, sellerWalletAddress, listingId } = event;


  console.log("Retrieving metadata for contractAddress:", contractAddress, "and tokenId:", tokenId);
  console.log("Retrieving metadata for buyerWalletAddress:", buyerWalletAddress, "and mode:", mode);
  console.log("Retrieving metadata for priceCurrencyCode:", priceCurrencyCode, "and price:", price);
  console.log("Retrieving metadata for quantity:", quantity, "and sellerWalletAddress:", sellerWalletAddress);
  // Listing ID is tenantId
  console.log("Retrieving metadata for listingId/tenantId:", listingId);
  const tokenIdInt = parseInt(tokenId);
  const receipt=await transferERC1155(buyerWalletAddress,tokenIdInt,quantity,'AVAX',contractAddress,listingId)
  return {
    status: 200,
    message: "retrieved successfully",
    transactionId: receipt.transactionHash.toString()
  };
};
