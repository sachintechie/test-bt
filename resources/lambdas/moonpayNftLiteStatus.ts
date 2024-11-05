import {web3Avax} from "./transferERC1155";

export const handler = async (event: any, context: any) => {
  //id is the transaction ID
  const {id} = event;
  console.log("id/transaction ID:", id);
  const transactionHash = id
  try {
    const transaction = await web3Avax.eth.getTransaction(transactionHash);

    if (transaction === null) {
      console.log("Transaction not found, it might still be pending or invalid.");
      return;
    }

    const receipt = await web3Avax.eth.getTransactionReceipt(transactionHash);

    let status;
    let statusChangedAt = "";
    const tokenIds = [] as any[]
    if (receipt === null) {
      // If receipt is null, the transaction is still pending
      status = "pending";
    } else {
      // If receipt exists, check if the transaction was successful
      status = receipt.status ? "completed" : "failed";
      const block = await web3Avax.eth.getBlock(receipt.blockNumber);
      const blockTimestamp = block.timestamp;

      // Convert the block timestamp to ISO format
      statusChangedAt = new Date(Number(blockTimestamp) * 1000).toISOString();

      const logs = receipt.logs as any[]
      // Iterate over logs to find the tokenId(s)
      logs.forEach(log => {
        if (log.topics.length > 0) {
          const transferEventSignature = web3Avax.utils.sha3('Transfer(address,address,uint256)');  // ERC721 transfer event
          const transferSingleSignature = web3Avax.utils.sha3('TransferSingle(address,address,address,uint256,uint256)');  // ERC1155 transfer event
          const transferBatchSignature = web3Avax.utils.sha3('TransferBatch(address,address,address,uint256[],uint256[])');  // ERC1155 batch transfer event

          // Check for ERC721 Transfer event
          if (log.topics[0] === transferEventSignature && log.topics.length === 4) {
            // TokenId is in the 4th topic (topics[3])
            tokenIds.push(web3Avax.utils.hexToNumberString(log.topics[3]));
          }

          // Check for ERC1155 TransferSingle event
          if (log.topics[0] === transferSingleSignature && log.topics.length === 4) {
            // TokenId is in the data, it's the first 32 bytes of the data field (64 hex characters)
            const tokenId = web3Avax.utils.hexToNumberString(log.data.slice(0, 66));
            tokenIds.push(tokenId);
          }

          // Check for ERC1155 TransferBatch event
          if (log.topics[0] === transferBatchSignature) {
            // TokenIds are in the data array, we need to parse the data for an array of token IDs
            const dataArray = log.data.slice(2).match(/.{1,64}/g);  // Slice out the '0x' and split every 64 hex characters
            dataArray.forEach((hexTokenId: string) => {
              const tokenId = web3Avax.utils.hexToNumberString(`0x${hexTokenId}`);
              tokenIds.push(tokenId);
            });
          }
        }
      });
    }

    // Example data format
    // @ts-ignore
    const data = {
      id: transactionHash,
      status,
      transactionHash: [transactionHash],
      statusChangedAt,  // Example current time, adjust as needed
      // @ts-ignore
      tokenId: tokenIds  // Parsing tokenId from logs if available
    };

    return [
      [
        {
          data
        }
      ]
    ];
  } catch (e) {
    return e
  }
}
