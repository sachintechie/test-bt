import Web3 from "web3";
import contractAbi from '../abi/BridgeTowerNftUpgradeableERC1155.json';
import {storeMetadataInDynamoDB} from "../utils/dynamodb";
import AWS from "aws-sdk";
import {getPayerCsSignerKey} from "../cubist/CubeSignerClient";
import {tenant} from "../db/models";

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
    const tenant= event.identity.resolverContext as tenant;
    const receipt=await mintERC1155(toAddress, ids, amounts, chain, contractAddress, metadata,tenant.id);

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

export const mintERC1155 = async (toAddress: string, ids: number[], amounts: number[], chain: string, contractAddress: string, metadata: any,tenantId:string) => {
  const web3=chain==='AVAX'?web3Avax:web3Eth;


  const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);

  const payerKey = await getPayerCsSignerKey("Ethereum", tenantId);
  const currentNonce = await web3.eth.getTransactionCount(payerKey.key?.materialId!, 'pending');
  const tx:any = {
    from: payerKey.key?.materialId,
    to: contractAddress,
    type:'0x02',
    maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'), // Priority fee for miners
    maxFeePerGas: web3.utils.toWei('30', 'gwei'),        // Maximum fee you're willing to pay
    data:  contract.methods.batchMint(toAddress, ids, amounts, web3.utils.padRight("0x0", 64)).encodeABI(),
    nonce: `0x${  currentNonce.toString(16)}`
  };

  // Estimate gas for the transaction if needed
  const gasEstimate = await web3.eth.estimateGas(tx);
  tx.gas  = `0x${  gasEstimate.toString(16)}`;
  // Adjust the gas limit accordingly if required
  console.log(tx)

  const signedTx = await payerKey.key?.signEvm({tx,chain_id:43113});
  const receipt = await web3.eth.sendSignedTransaction(signedTx?.data()?.rlp_signed_tx||'');


  // eslint-disable-next-line no-restricted-syntax
  for (const i of ids) {
    await storeMetadataInDynamoDB(dynamoDB,contractAddress, i, metadata);
  }

  return receipt;
}