import Web3 from "web3";
import contractAbi from "../abi/BridgeTowerNftUpgradeable.json";
import { getPayerCsSignerKey } from "../cubist/CubeSignerClient";
import { tenant } from "../db/models";
import { getPrismaClient } from "../db/dbFunctions";

const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);

export const handler = async (event: any, context: any) => {
  const { toAddress, tokenIds, chain, contractAddress } = event.arguments?.input;

  try {
    const tenant = event.identity.resolverContext as tenant;
    const tenantId = tenant.id;
    const receipt = await transferNFT(toAddress, tokenIds, chain, contractAddress, tenantId,"admin","admin");
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

export const transferNFT = async (toAddress: string, tokenIds: any, chain: string, contractAddress: string, tenantId: string,provider:string,providerId:string) => {
  const web3 = chain === "AVAX" ? web3Avax : web3Eth;
  const payerKey = await getPayerCsSignerKey("Ethereum", tenantId);

  const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);
  const currentNonce = await web3.eth.getTransactionCount(payerKey.key?.materialId!, "pending");
  const tx: any = {
    from: payerKey.key?.materialId,
    to: contractAddress,
    type: "0x02",
    maxPriorityFeePerGas: web3.utils.toWei("1", "gwei"), // Priority fee for miners
    maxFeePerGas: web3.utils.toWei("30", "gwei"), // Maximum fee you're willing to pay
    data: contract.methods.batchTransfer(payerKey.key?.materialId, toAddress, tokenIds).encodeABI(),
    nonce: `0x${currentNonce.toString(16)}`
  };

  // Estimate gas for the transaction if needed
  const gasEstimate = await web3.eth.estimateGas(tx);
  tx.gas = `0x${gasEstimate.toString(16)}`;
  // Adjust the gas limit accordingly if required
  console.log(tx);

  const signedTx = await payerKey.key?.signEvm({ tx, chain_id: 43113 });
  const receipt = await web3.eth.sendSignedTransaction(signedTx?.data()?.rlp_signed_tx || "");

  const prisma = await getPrismaClient();
  for (const tokenId of (tokenIds as number[])) {
    await prisma.contracttransaction.create({
      data: {
        txhash: receipt.transactionHash.toString(),
        contractaddress: contractAddress,
        chain: chain,
        fromaddress: payerKey.key?.materialId!,
        toaddress: toAddress,
        tokenid:tokenId,
        amount:1,
        tokentype: "ERC721"
      }
    });
  }
  await prisma.paymenttransaction.create({
    data: {
      txhash: receipt.transactionHash.toString(),
      toaddress: toAddress,
      provider:provider,
      providerid:providerId
    }
  });

  return receipt;
};
