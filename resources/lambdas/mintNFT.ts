import Web3 from "web3";
import contractAbi from "../abi/BridgeTowerNftUpgradeable.json";
import AWS from "aws-sdk";
import { storeMetadataInDynamoDB } from "../utils/dynamodb";
import { tenant } from "../db/models";
import { getPayerCsSignerKey } from "../cubist/CubeSignerClient";
import { getPrismaClient } from "../db/dbFunctions";
import { NFTUtilities, Party, Scope } from "../provenance/nftUtilities";
import { CHAIN_TO_CHAIN_NAME_MAPPING } from "../utils/utils";

const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);
const dynamoDB = new AWS.DynamoDB.DocumentClient();

export const handler = async (event: any, context: any) => {
  const { chain } = event.arguments?.input;
  const tenant = event.identity.resolverContext as tenant;
  const tenantId = tenant.id;
  if (chain === CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE) {
    try {
      const { toAddress, numberOfTokens, chain, contractAddress, metadata } = event.arguments?.input;
      const receipt = await mintNFT(toAddress, numberOfTokens, chain, contractAddress, metadata, tenantId);

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
  } else if (chain === CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE) {
    console.log("Executing mintNftProvenance");
    try {
      const { scopeSpecificationUUID, party, scope, uuid, metadata } = event.arguments?.input;
      console.log(scopeSpecificationUUID, party, scope, uuid, metadata);
      const data = await mintNftProvenance(scopeSpecificationUUID, party, scope, uuid, metadata, tenantId);

      return {
        status: 200,
        data: data,
        error: null
      };
    } catch (error: any) {
      return {
        status: 500,
        data: null,
        error: error.message
      };
    }
  }
  return {
    status: 400,
    transactionHash: null,
    error: "Invalid chain"
  };
};

export const mintNFT = async (
  toAddress: string,
  numberOfTokens: number,
  chain: string,
  contractAddress: string,
  metadata: any,
  tenantId: string
) => {
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
    data: contract.methods.batchMint(toAddress, numberOfTokens).encodeABI(),
    nonce: `0x${currentNonce.toString(16)}`
  };

  // Estimate gas for the transaction if needed
  const gasEstimate = await web3.eth.estimateGas(tx);
  tx.gas = `0x${gasEstimate.toString(16)}`;
  // Adjust the gas limit accordingly if required
  console.log(tx);
  const nextTokenId = (await contract.methods.getNextTokenId().call()) as BigInt;

  const signedTx = await payerKey.key?.signEvm({ tx, chain_id: 43113 });
  const receipt = await web3.eth.sendSignedTransaction(signedTx?.data()?.rlp_signed_tx || "");

  const prisma = await getPrismaClient();
  for (let i = 0; i < numberOfTokens; i++) {
    await storeMetadataInDynamoDB(dynamoDB, contractAddress, Number(nextTokenId) + i, metadata);
    await prisma.contracttransaction.create({
      data: {
        txhash: receipt.transactionHash.toString(),
        contractaddress: contractAddress,
        chain: chain,
        fromaddress: payerKey.key?.materialId!,
        toaddress: toAddress,
        tokenid: Number(nextTokenId) + i,
        amount: 1,
        tokentype: "ERC721"
      }
    });
    await prisma.paymenttransaction.create({
      data: {
        txhash: receipt.transactionHash.toString(),
        toaddress: toAddress,
        provider: "admin",
        providerid: "admin"
      }
    });
  }

  return receipt;
};

export const mintNftProvenance = async (
  scope_specification_uuid: string,
  party: Party,
  scope: Scope,
  uuid: string,
  metadata: any,
  tenantId: string
) => {
  const nftUtilities = new NFTUtilities(process.env.PROVENANCE_API_ENDPOINT!, process.env.PROVENANCE_API_KEY!);
  console.log(process.env.PROVENANCE_API_ENDPOINT, process.env.PROVENANCE_API_KEY);
  const data = await nftUtilities.mintScope(scope_specification_uuid, {
    party: party,
    scope: scope,
    uuid: uuid,
    records: {}
  });

  console.log(data);

  // storing metadata to dynamodb
  await storeMetadataInDynamoDB(dynamoDB, scope_specification_uuid, data.scope_uuid, metadata);
  const prisma = await getPrismaClient();

  console.log("Storing contract transaction");
  await prisma.contracttransaction.create({
    data: {
      txhash: data.tx_hash,
      contractaddress: scope_specification_uuid,
      chain: "Provenance",
      fromaddress: party.address,
      toaddress: scope.value_owner_address,
      tokenid: data.scope_uuid,
      amount: 1,
      tokentype: "NFT"
    }
  });
  console.log("Storing payment transaction");
  await prisma.paymenttransaction.create({
    data: {
      txhash: data.tx_hash,
      toaddress: scope.value_owner_address,
      provider: "admin",
      providerid: "admin"
    }
  });

  return data;
};
