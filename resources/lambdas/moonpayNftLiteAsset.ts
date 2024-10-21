export const handler = async (event: any, context: any) => {
  const { contractAddress, tokenId, walletAddress } = event;
  console.log("Retrieving metadata for contractAddress:", contractAddress, "and tokenId:", tokenId);
  console.log("Retrieving metadata for walletAddress:", walletAddress);

  let network = "avalanche_c_chain";
  if(contractAddress !== "0x698ca34160962dd9826E25ecb1b1b73d756b71b5") {
    network='ethereum'
  }

  return {
    status: 200,
    message: "retrieved successfully",
    asset: {
      tokenId: "10",
      contractAddress: "0x698ca34160962dd9826E25ecb1b1b73d756b71b5",
      name: "BridgetNFT",
      collection: "BridgetNFT",
      imageUrl:
        "https://food.fnr.sndimg.com/content/dam/images/food/fullset/2023/10/5/rapeseed-oil-canola-oil-in-glass-jug-with-flowers-on-white-background.jpg.rend.hgtvcom.616.411.suffix/1696509950207.jpeg",
      explorerUrl: "https://43113.testnet.routescan.io/nft/0x698ca34160962dd9826E25ecb1b1b73d756b71b5/37",
      price: 25,
      priceCurrencyCode: "USDC",
      quantity: 1,
      sellerAddress: "0x77a038d87fd230F39dF6A29707428606C4DF625C",
      sellType: "Primary",
      flow: "Lite",
      network: network
    }
  };
};
