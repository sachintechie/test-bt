import Web3 from "web3";
import contractAbi from '../abi/BridgeTowerNftUpgradeable.json';


const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const CONTRACT_ABI = contractAbi.abi;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);

export const handler = async (event: any, context: any) => {
  const {  toAddress, tokenId, amount, chain, contractAddress } = event;
  const web3=chain==='AVAX'?web3Avax:web3Eth;

  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);

  const contract = new web3.eth.Contract(CONTRACT_ABI, contractAddress);

  const tx = {
    from: account.address,
    to: contractAddress,
    gas: 300000,
    data:  contract.methods.safeTransferFrom(account.address, toAddress, tokenId, amount, undefined).encodeABI()
  };

  try {
    const receipt = await web3.eth.sendTransaction(tx);
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
