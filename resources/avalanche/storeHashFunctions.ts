import { ethers } from "ethers";
// Environment variables (set in AWS Lambda or using dotenv)
const AVAX_RPC_URL = process.env.AVAX_RPC_URL; // Infura or any RPC provider URL
const PRIVATE_KEY = process.env.AVAX_PRIVATE_KEY; // Private key of the wallet making the transaction
const CONTRACT_ADDRESS = process.env.STORE_AVAX_CONTRACT_ADDRESS; // Deployed contract address
const CONTRACT_ABI :any[] =[
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "index",
          "type": "uint256"
        }
      ],
      "name": "getInteraction",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "interactions",
      "outputs": [
        {
          "internalType": "bytes32",
          "name": "hash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "metadata",
          "type": "string"
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
          "name": "_hash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "_metadata",
          "type": "string"
        }
      ],
      "name": "storeHash",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];
export async function storeHash(dataHash: string,metaData: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    // Format the data hash to bytes32
   // const _dataHash = ethers.utils.formatBytes32String(dataHash);

    console.log("Data Hash (bytes32):", dataHash);
    // Connect to the smart contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
   const _dataHash = "0x" + dataHash;
   const _metadata=metaData.toString();

    const tx = await contract.storeHash(_dataHash,_metadata);
    console.log("Transaction sent:", tx.hash);

    const receipt = await tx.wait();

    console.log("Transaction confirmed in block:", receipt.blockNumber);
    const transaction = await provider.getTransaction(receipt.transactionHash);

    if (transaction) {
      console.log("Transaction Details:", transaction.data);
    } else {
      console.log("Transaction not found.");
    }
    const iface = new ethers.utils.Interface(CONTRACT_ABI);
    // Decode the input data
    const parsedTransaction = iface.parseTransaction({ data: transaction.data });
    console.log("parsedTransaction Arguments:", parsedTransaction);

    return {
      data: {
        message: "Transaction successful!",
        transactionHash: receipt.transactionHash,
        dataHash:parsedTransaction.args._hash,
        metaData: parsedTransaction.args._metadata,
        transactionDetails: transaction,
        error: null
      }
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
