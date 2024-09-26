import {transferNFT} from "./transferNFT";


export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId,buyerWalletAddress,mode,priceCurrencyCode,price,quantity,sellerWalletAddress,listingId } = event;

  console.log('Retrieving metadata for contractAddress:', contractAddress, 'and tokenId:', tokenId)
  console.log('Retrieving metadata for buyerWalletAddress:', buyerWalletAddress, 'and mode:', mode)
  console.log('Retrieving metadata for priceCurrencyCode:', priceCurrencyCode, 'and price:', price)
  console.log('Retrieving metadata for quantity:', quantity, 'and sellerWalletAddress:', sellerWalletAddress)
  console.log('Retrieving metadata for listingId:', listingId)
  const tokenIdInt=parseInt(tokenId);
  // const receipt=await transferNFT(buyerWalletAddress,[tokenIdInt],'AVAX',contractAddress,'46a1ef54-2531-40a0-a42f-308b0598c24a');
  console.log('This is dummy transfer process')
  return {
    status: 200,
    message: 'retrieved successfully',
    transactionId:'46a1ef54-2531-40a0-a42f-308b0598c24a',
  };
};
