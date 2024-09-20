import { avm, pvm, evm } from "@avalabs/avalanchejs";
import { ethers } from "ethers";
const CONTRACT_ABI :any[] =[
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
// Environment variables (set in AWS Lambda or using dotenv)
const AVAX_RPC_URL = process.env.AVAX_RPC_URL; // Infura or any RPC provider URL
export async function getAvaxBalance(address: string) {
  try {
    const pAddress: string = "P-" + address;
    const { avmapi, pvmapi } = await getAvaxConnection();
    const balanceRes = await pvmapi.getBalance({ addresses: [pAddress] });
    console.log(balanceRes);
    //let sendingAmount = parseFloat(amount.toString());
    let LAMPORTS_PER_AVAX = 10 ** 9;
    console.log("LAMPORTS_PER_AVAX", LAMPORTS_PER_AVAX);

    const balance = Number(balanceRes.balance) / LAMPORTS_PER_AVAX;
    return balance;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

export async function getAvaxConnection() {
  const pvmapi = new pvm.PVMApi( process.env["AVAX_URL"]);
  const avmapi = new avm.AVMApi( process.env["AVAX_URL"]);
 
  // const ip: string = process.env["AVAX_URL"]! // Testnet URL
  // const port: number = 443;
  // const protocol: string = "https";
  const AVAX_NETWORK_ID: string = process.env["AVAX_NETWORK_ID"]!;
  const networkID: number = Number.parseInt(AVAX_NETWORK_ID);
  //  const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
  // const xchain: AVMAPI = avalanche.XChain();
  // const pchain: PlatformVMAPI = avalanche.PChain();
  return { pvmapi, avmapi, networkID };
}

export async function verifyAvalancheTransaction(txID: string) {
  try {
    const { pvmapi } = await getAvaxConnection();
    const status = await pvmapi.getTxStatus({ txID });
    console.log(`Transaction Status: ${status.status}`);
    return status;
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return null;
  }
}

export async function getHashTransactionDetails(txID: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(AVAX_RPC_URL);

    const transaction = await provider.getTransaction(txID);

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
        transactionHash: transaction.hash,
        hash:parsedTransaction.args._dataHash,
        metaData: parsedTransaction.args._metaData,
        blockHash:transaction.blockHash,
        type:transaction.type,
        blockNumber:transaction.blockNumber,
        confirmations:transaction.confirmations,
        from:transaction.from,
        to:transaction.to,
        nonce:transaction.nonce,
        chainId:transaction.chainId,
      },error:null
    };
  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return {
      data: null,
      error: error
    };
    }
}
