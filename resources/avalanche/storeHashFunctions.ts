import { ethers } from "ethers";
import { AvalancheTransactionStatus } from "../db/models";
import * as crypto from "crypto";
import contractAbi from "../abi/StoreHash.json";
import subnetContractAbi from "../abi/StoreHashSubnet.json";

// Environment variables (set in AWS Lambda or using dotenv)
const AVAX_RPC_SUBNET_URL = process.env.AVAX_RPC_SUBNET_URL; // Infura or any RPC provider URL
const AVAX_RPC_URL = process.env.AVAX_RPC_URL; // Infura or any RPC provider URL

const PRIVATE_KEY = process.env.AVAX_PRIVATE_KEY; // Private key of the wallet making the transaction
const SUBNET_CONTRACT_ADDRESS = process.env.STORE_AVAX_SUBNET_CONTRACT_ADDRESS; // Deployed contract address

const CONTRACT_ADDRESS = process.env.STORE_AVAX_CONTRACT_ADDRESS; // Deployed contract address
const CONTRACT_ABI: any[] =contractAbi.abi;

const SUBNET_CONTRACT_ABI: any[] =subnetContractAbi.abi;

export async function storeHash(hash: string,isSecondTx?:boolean) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
      // Get the current nonce for the wallet address
  let currentNonce = await provider.getTransactionCount(wallet.address, "pending");
  if(isSecondTx){
    currentNonce = currentNonce + 1;
  }

    // Dynamically get the current gas price
    const gasPrice = await provider.getGasPrice();

    // Format the data hash to bytes32
    // const _dataHash = ethers.utils.formatBytes32String(dataHash);

    console.log("Data Hash (bytes32):", hash);
    // Connect to the smart contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
    const _hash = "0x" + hash;
    const _metadata = "0x" + hash;
    // Estimate gas limit with buffer
    const estimatedGasLimit = await contract.estimateGas.storeHash(_hash, _metadata);
    const gasLimit = ethers.BigNumber.from("50000");
    //const gasLimit = estimatedGasLimit.mul(120).div(100); // Adding a 20% buffer

  // Set custom options, including the nonce
  const options = {
    gasLimit,
    gasPrice,
    nonce: currentNonce,
    // gasLimit: ethers.utils.hexlify(100000), // Adjust gas limit as needed
    // gasPrice: ethers.utils.parseUnits("25", "gwei") // Adjust gas price based on network conditions
  };


    const tx = await contract.storeHash(_hash, _metadata,options);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();

    console.log("Transaction confirmed in block:", receipt);
    const transaction = await provider.getTransaction(receipt.transactionHash);

    const transactionReceipt = await provider.getTransactionReceipt(receipt.transactionHash);
    const blockDetails = await provider.getBlock(receipt.blockHash);
    const transactionTimestamp = new Date(blockDetails.timestamp * 1000);

    const status = AvalancheTransactionStatus[transactionReceipt.status!];

    if (transaction) {
      console.log("Transaction Details:", transaction.data);
    } else {
      console.log("Transaction not found.");
    }
    const iface = new ethers.utils.Interface(CONTRACT_ABI);
    // Decode the input data
    const parsedTransaction = iface.parseTransaction({ data: transaction.data });
    console.log("parsedTransaction Arguments:", parsedTransaction);

    const gas = ((Number(transactionReceipt.effectiveGasPrice) / 1e9) * Number(transactionReceipt.cumulativeGasUsed!)) / 1e9;

    return {
      data: {
        message: "Transaction successful!",
        transactionId: transactionReceipt.transactionHash,
        status: status,
        hash: parsedTransaction.args._dataHash.split("0x")[1],
        metaData: parsedTransaction.args._metaData,
        blockHash: transaction.blockHash,
        type: transaction.type,
        timestamp: transactionTimestamp,
        blockNumber: transaction.blockNumber,
        confirmations: transaction.confirmations,
        from: transaction.from,
        to: transaction.to,
        gasLimit: transaction.gasLimit.toString(),
        gasPrice: transaction.gasPrice?.toString(),
        gas: gas.toString(),
        nonce: transaction.nonce,
        chainId: transaction.chainId,
        chainType: "Avalanche"
      },
      error: null
    };
  } catch (error) {
    // Handle any errors
    console.log("Error: ", error);
    return {
      data: null,
      error: error
    };
  }
}


export async function hashingAndStoreToBlockchain(data: any,isSecondTx?:boolean) {
  try {

    const dataHash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
    console.log("dataHash", dataHash);
    const dataTxHash = await storeHash(dataHash,isSecondTx);
    console.log("dataTxHash", dataTxHash);
    
    return {
      data: {
        hash:dataHash,
        txHash : dataTxHash?.data?.transactionId,
        chainId: dataTxHash?.data?.chainId,
        chainType: dataTxHash?.data?.chainType,
        status: dataTxHash?.data?.status,
        gasFee: dataTxHash?.data?.gas,
        nonce: dataTxHash?.data?.nonce,
        blockHash: dataTxHash?.data?.blockHash,
        type: dataTxHash?.data?.type,
        timestamp: dataTxHash?.data?.timestamp,
        blockNumber: dataTxHash?.data?.blockNumber,
        confirmations: dataTxHash?.data?.confirmations,

      },
      error: null
    };
  } catch (error) {
    // Handle any errors
    console.log("Error: ", error);
    return {
      data: null,
      error: error
    };
  }
}
export async function hashing(data: any) {
  try {

    const dataHash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
    console.log("dataHash", dataHash);
    
    return {
      data: {
        dataHash
      },
      error: null
    };
  } catch (error) {
    // Handle any errors
    console.log("Error: ", error);
    return {
      data: null,
      error: error
    };
  }
}

export async function storeHashOnSubnet(hash: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_SUBNET_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    // Format the data hash to bytes32
    // const _dataHash = ethers.utils.formatBytes32String(dataHash);

    console.log("Data Hash (bytes32):", hash);
    // Connect to the smart contract
    const contract = new ethers.Contract(SUBNET_CONTRACT_ADDRESS!, SUBNET_CONTRACT_ABI, wallet);
    const _hash = "0x" + hash;
    const _metadata = "0x" + hash;

    const tx = await contract.storeHash(_hash, _metadata);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();

    console.log("Transaction confirmed in block:", receipt);
    const transaction = await provider.getTransaction(receipt.transactionHash);

    const transactionReceipt = await provider.getTransactionReceipt(receipt.transactionHash);
    const blockDetails = await provider.getBlock(receipt.blockHash);
    const transactionTimestamp = new Date(blockDetails.timestamp * 1000);

    const status = AvalancheTransactionStatus[transactionReceipt.status!];

    if (transaction) {
      console.log("Transaction Details:", transaction.data);
    } else {
      console.log("Transaction not found.");
    }
    const iface = new ethers.utils.Interface(SUBNET_CONTRACT_ABI);
    // Decode the input data
    const parsedTransaction = iface.parseTransaction({ data: transaction.data });
    console.log("parsedTransaction Arguments:", parsedTransaction);

    const gas = ((Number(transactionReceipt.effectiveGasPrice) / 1e9) * Number(transactionReceipt.cumulativeGasUsed!)) / 1e9;

    return {
      data: {
        message: "Transaction successful!",
        transactionId: transactionReceipt.transactionHash,
        status: status,
        hash: parsedTransaction.args._dataHash.split("0x")[1],
        metaData: parsedTransaction.args._metaData,
        blockHash: transaction.blockHash,
        type: transaction.type,
        timestamp: transactionTimestamp,
        blockNumber: transaction.blockNumber,
        confirmations: transaction.confirmations,
        from: transaction.from,
        to: transaction.to,
        gasLimit: transaction.gasLimit.toString(),
        gasPrice: transaction.gasPrice?.toString(),
        gas: gas.toString(),
        nonce: transaction.nonce,
        chainId: transaction.chainId
      },
      error: null
    };
  } catch (error) {
    // Handle any errors
    console.log("Error: ", error);
    return {
      data: null,
      error: error
    };
  }
}