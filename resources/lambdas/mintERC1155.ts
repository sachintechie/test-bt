import Web3 from "web3";
import contractAbi from '../abi/BridgeTowerNftUpgradeableERC1155.json';
import {storeMetadataInDynamoDB} from "../utils/dynamodb";
import AWS from "aws-sdk";


const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any, context: any) => {
  const { toAddress, ids, amounts, chain, contractAddress,metadata } = event.arguments?.input;
  try {
    const receipt=await mintERC1155(toAddress, ids, amounts, chain, contractAddress, metadata);

    return {
      status: 200,
      transactionHash: receipt.transactionHash,
      error: null
    };
  } catch (error: any) {
    return {
      status: 500,
      transactionHash: null,
      error: error.message
    };
  }
};

export const mintERC1155 = async (toAddress: string, ids: number[], amounts: number[], chain: string, contractAddress: string, metadata: any) => {
  const web3=chain==='AVAX'?web3Avax:web3Eth;

  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);

  const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);

  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 300000,
    data:  contract.methods.batchMint(toAddress, ids, amounts, web3.utils.padRight("0x0", 64)).encodeABI()
  };

  const receipt = await web3.eth.sendTransaction(tx);

  // eslint-disable-next-line no-restricted-syntax
  for (const i of ids) {
    await storeMetadataInDynamoDB(dynamoDB,contractAddress, i, metadata);
  }

  return receipt;
}