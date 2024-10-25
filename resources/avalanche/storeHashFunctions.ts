import { ethers } from "ethers";
import { AvalancheTransactionStatus } from "../db/models";
import * as crypto from "crypto";

// Environment variables (set in AWS Lambda or using dotenv)
const AVAX_RPC_SUBNET_URL = process.env.AVAX_RPC_SUBNET_URL; // Infura or any RPC provider URL
const AVAX_RPC_URL = process.env.AVAX_RPC_URL; // Infura or any RPC provider URL

const PRIVATE_KEY = process.env.AVAX_PRIVATE_KEY; // Private key of the wallet making the transaction
const SUBNET_CONTRACT_ADDRESS = process.env.STORE_AVAX_SUBNET_CONTRACT_ADDRESS; // Deployed contract address

const CONTRACT_ADDRESS = process.env.STORE_AVAX_CONTRACT_ADDRESS; // Deployed contract address
const CONTRACT_ABI: any[] = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "user",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "hash",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "metadata",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    name: "HashStored",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "user",
        type: "address"
      }
    ],
    name: "getHashData",
    outputs: [
      {
        internalType: "bytes32",
        name: "dataHash",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "metadata",
        type: "bytes32"
      },
      {
        internalType: "uint256",
        name: "timestamp",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "_dataHash",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "_metaData",
        type: "bytes32"
      }
    ],
    name: "storeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];
const SUBNET_CONTRACT_ABI: any[] =[
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "internalType": "address",
              "name": "user",
              "type": "address"
          },
          {
              "indexed": false,
              "internalType": "bytes32",
              "name": "hash",
              "type": "bytes32"
          },
          {
              "indexed": false,
              "internalType": "bytes32",
              "name": "metadata",
              "type": "bytes32"
          },
          {
              "indexed": false,
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
          }
      ],
      "name": "HashStored",
      "type": "event"
  },
  {
      "inputs": [
          {
              "internalType": "address",
              "name": "user",
              "type": "address"
          }
      ],
      "name": "getHashData",
      "outputs": [
          {
              "internalType": "bytes32",
              "name": "dataHash",
              "type": "bytes32"
          },
          {
              "internalType": "bytes32",
              "name": "metadata",
              "type": "bytes32"
          },
          {
              "internalType": "uint256",
              "name": "timestamp",
              "type": "uint256"
          }
      ],
      "stateMutability": "view",
      "type": "function"
  },
  {
      "inputs": [
          {
              "internalType": "bytes32",
              "name": "_dataHash",
              "type": "bytes32"
          },
          {
              "internalType": "bytes32",
              "name": "_metaData",
              "type": "bytes32"
          }
      ],
      "name": "storeHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
  }
];

export async function storeHash(hash: string,chainType: string) {
  try {
    if(chainType === "Avalanche"){
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    // Format the data hash to bytes32
    // const _dataHash = ethers.utils.formatBytes32String(dataHash);

    console.log("Data Hash (bytes32):", hash);
    // Connect to the smart contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
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
  }
  else if(chainType === "Provenance"){
      const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);
  
      // Format the data hash to bytes32
      // const _dataHash = ethers.utils.formatBytes32String(dataHash);
  
      console.log("Data Hash (bytes32):", hash);
      // Connect to the smart contract
      const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
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
    
  }
  else{
    return {
      data: null,
      error: "ChainType not supported"
    };
  }
  } catch (error) {
    // Handle any errors
    console.log("Error: ", error);
    return {
      data: null,
      error: error
    };
  }
}


export async function hashingAndStoreToBlockchain(data: any) {
  try {

    const dataHash = crypto.createHash("sha256").update(JSON.stringify(data)).digest("hex");
    console.log("dataHash", dataHash);
    const dataTxHash = await storeHash(dataHash,"Avalanche");
    console.log("dataTxHash", dataTxHash);
    
    return {
      data: {
        dataHash,
        dataTxHash : dataTxHash?.data?.transactionId,
        chainId: dataTxHash?.data?.chainId,
        chainType: dataTxHash?.data?.chainType
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