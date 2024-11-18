import Web3 from "web3";
import * as cs from "@cubist-labs/cubesigner-sdk";
import contractAbi from "../abi/BridgeTowerNftUpgradeable.json";
import { getPayerCsSignerKey, oidcLogin } from "../cubist/CubeSignerClient";
import { tenant } from "../db/models";
import { getCubistConfig, getPrismaClient } from "../db/dbFunctions";
import { CHAIN_TO_CHAIN_NAME_MAPPING, deriveDisplayAddressForCustomChains } from "../utils/utils";
import { ProvenanceClient } from "../provenance/provenanceClient";

const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export const handler = async (event: any, context: any) => {
  const { fromAddress, toAddress, tokenIds, chain, contractAddress } = event.arguments?.input;
  if (chain === CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE) {
    try {
      const tenant = event.identity.resolverContext as tenant;
      const tenantId = tenant.id;
      const receipt = await transferNFT(toAddress, tokenIds, chain, contractAddress, tenantId, "admin", "admin");
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
  } else if (chain == CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE) {
    try {
      // get the user wallet
      const tenant = event.identity.resolverContext as tenant;
      const tenantId = tenant.id;
      const oidcToken = event.headers?.identity;

      const result = await transferNFTProvenance(
        fromAddress,
        toAddress,
        tokenIds,
        chain,
        contractAddress,
        tenantId,
        "admin",
        oidcToken,
        "admin"
      );

      return {
        status: 200,
        transaction: result,
        error: null
      };
    } catch (error: any) {
      return {
        status: 500,
        transactionHash: null,
        error: error.message
      };
    }
  } else {
    return {
      status: 400,
      transactionHash: null,
      error: "Invalid chain"
    };
  }
};

export const transferNFT = async (
  toAddress: string,
  tokenIds: any,
  chain: string,
  contractAddress: string,
  tenantId: string,
  provider: string,
  providerId: string
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
  for (const tokenId of tokenIds as number[]) {
    await prisma.contracttransaction.create({
      data: {
        txhash: receipt.transactionHash.toString(),
        contractaddress: contractAddress,
        chain: chain,
        fromaddress: payerKey.key?.materialId!,
        toaddress: toAddress,
        tokenid: tokenId,
        amount: 1,
        tokentype: "ERC721"
      }
    });
  }
  await prisma.paymenttransaction.create({
    data: {
      txhash: receipt.transactionHash.toString(),
      toaddress: toAddress,
      provider: provider,
      providerid: providerId
    }
  });

  return receipt;
};

export const transferNFTProvenance = async (
  fromAddress: string,
  toAddress: string,
  tokenIds: any,
  chain: string,
  contractAddress: string,
  tenantId: string,
  provider: string,
  oidcToken: string,
  providerId: string
) => {
  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please provide an identity token for verification"
      };
    }
    const cubistConfig = await getCubistConfig(tenantId);
    if (cubistConfig == null) {
      return {
        transaction: null,
        error: "Cubist Configuration not found for the given tenant"
      };
    }
    const oidcClient = await oidcLogin(env, cubistConfig.orgid, oidcToken, ["sign:*", "manage:key:*"]);
    if (!oidcClient) {
      return {
        transaction: null,
        error: "Failed to login with the provided token"
      };
    }
    const keys = await oidcClient.sessionKeys();

    const key = keys.find(
      (key: cs.Key) => deriveDisplayAddressForCustomChains(CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE, key) === fromAddress
    );

    if (!key) {
      return {
        transaction: null,
        error: "Key not found for the given address"
      };
    }
    const provenanceClient = new ProvenanceClient(process.env.PROVENANCE_RPC_URL!, key);
    const client = await provenanceClient.getSigningStargateClient();
    const result = await client.sendTokens(
      deriveDisplayAddressForCustomChains(CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE, key),
      toAddress,
      [
        {
          denom: tokenIds,
          amount: "1"
        }
      ],
      {
        amount: [{ denom: "nhash", amount: "1905000000" }],
        gas: "100000"
      },
      "Provenance Nft Transfer"
    );

    const prisma = await getPrismaClient();

    await prisma.contracttransaction.create({
      data: {
        txhash: result.transactionHash,
        contractaddress: contractAddress,
        chain: chain,
        fromaddress: fromAddress,
        toaddress: toAddress,
        tokenid: tokenIds,
        amount: 1,
        tokentype: "ERC721"
      }
    });
    return result;
  } catch (error: any) {
    return {
      transaction: null,
      error: error.message
    };
  }
};
