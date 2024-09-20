import { ethers } from "ethers";
// Environment variables (set in AWS Lambda or using dotenv)
const AVAX_RPC_URL = process.env.AVAX_RPC_URL; // Infura or any RPC provider URL
const PRIVATE_KEY = process.env.AVAX_PRIVATE_KEY; // Private key of the wallet making the transaction
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
        name: "dataHash",
        type: "bytes32"
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
      }
    ],
    name: "storeHash",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    name: "storedHashes",
    outputs: [
      {
        internalType: "bytes32",
        name: "dataHash",
        type: "bytes32"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];

export async function storeHash(dataHash: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY!, provider);

    // Format the data hash to bytes32
    const _dataHash = ethers.utils.formatBytes32String(dataHash);

    console.log("Data Hash (bytes32):", dataHash);
    // Connect to the smart contract
    const contract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, wallet);
    console.log("Contract connected:", _dataHash);
    console.log("Data hash:", dataHash);
    console.log("Storing data hash in the contract...", ethers.utils.toUtf8String(dataHash));

    const tx = await contract.storeHash(dataHash);
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
    console.log("Decoded Arguments:", parsedTransaction);
    const decodedDataHash = ethers.utils.parseBytes32String(parsedTransaction.args[0]); // Assuming _dataHash is the first argument

    return {
      data: {
        message: "Transaction successful!",
        transactionHash: receipt.transactionHash,
        dataHash: decodedDataHash,
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
