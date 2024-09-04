import Web3 from "web3";
import contractAbi from '../abi/BridgeTowerNftUpgradeable.json';
import AWS from "aws-sdk";
import {storeMetadataInDynamoDB} from "../utils/dynamodb";


const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);
const dynamoDB = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any, context: any) => {
  const { toAddress, numberOfTokens, chain, contractAddress, metadata } = event.arguments?.input;
  try{
    const web3=chain==='AVAX'?web3Avax:web3Eth;

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);


    const tx = {
      from: account.address,
      to: contractAddress,
      gas: 300000,
      data: contract.methods.batchMint(toAddress, numberOfTokens).encodeABI()
    };

    const nextTokenId = await contract.methods.getNextTokenId().call() as BigInt;

    const receipt = await web3.eth.sendTransaction(tx);

    for (let i = 0; i < numberOfTokens; i++) {
      await storeMetadataInDynamoDB(dynamoDB,contractAddress, Number(nextTokenId)+i, metadata);
    }

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
