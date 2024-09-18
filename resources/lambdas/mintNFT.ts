import Web3 from "web3";
import contractAbi from '../abi/BridgeTowerNftUpgradeable.json';
import AWS from "aws-sdk";
import {storeMetadataInDynamoDB} from "../utils/dynamodb";
import {tenant} from "../db/models";
import {getPayerCsSignerKey} from "../cubist/CubeSignerClient";
import {getPrismaClient} from "../db/dbFunctions";

const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);
const dynamoDB = new AWS.DynamoDB.DocumentClient();


export const handler = async (event: any, context: any) => {
  const { toAddress, numberOfTokens, chain, contractAddress, metadata } = event.arguments?.input;
  try{
    const tenant= event.identity.resolverContext as tenant;
    const tenantId=tenant.id;
    const receipt = await mintNFT(toAddress, numberOfTokens, chain, contractAddress, metadata,tenantId);

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

export const mintNFT = async (toAddress: string, numberOfTokens: number, chain: string, contractAddress: string, metadata: any,tenantId:string) => {
  const web3=chain==='AVAX'?web3Avax:web3Eth;
  const payerKey = await getPayerCsSignerKey("Ethereum", tenantId);

  const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
  const currentNonce = await web3.eth.getTransactionCount(payerKey.key?.materialId!, 'pending');
  const tx:any = {
    from: payerKey.key?.materialId,
    to: contractAddress,
    type:'0x02',
    maxPriorityFeePerGas: web3.utils.toWei('1', 'gwei'), // Priority fee for miners
    maxFeePerGas: web3.utils.toWei('30', 'gwei'),        // Maximum fee you're willing to pay
    data: contract.methods.batchMint(toAddress, numberOfTokens).encodeABI(),
    nonce: `0x${  currentNonce.toString(16)}`
  };

  // Estimate gas for the transaction if needed
  const gasEstimate = await web3.eth.estimateGas(tx);
  tx.gas  = `0x${  gasEstimate.toString(16)}`;
  // Adjust the gas limit accordingly if required
  console.log(tx)

  const signedTx = await payerKey.key?.signEvm({tx,chain_id:43113});
  const receipt = await web3.eth.sendSignedTransaction(signedTx?.data()?.rlp_signed_tx||'');


  const nextTokenId = await contract.methods.getNextTokenId().call() as BigInt;

  for (let i = 0; i < numberOfTokens; i++) {
    await storeMetadataInDynamoDB(dynamoDB,contractAddress, Number(nextTokenId)+i, metadata);
  }

  const prisma = await getPrismaClient();
  await prisma.contracttransaction.create(
    {
      data: {
        txhash: receipt.transactionHash.toString(),
        contractaddress: contractAddress,
        chain: chain,
        fromaddress: payerKey.key?.materialId!,
        methodname: 'batchMint',
        params: JSON.stringify({to: toAddress, numberOfTokens: numberOfTokens}),
      }
    }
  )

  return receipt;
}
