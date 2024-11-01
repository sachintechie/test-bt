import {getPrismaClient, getWalletByCustomer} from "../db/dbFunctions";
import { tenant } from "../db/models";
import {getPayerCsSignerKey} from "../cubist/CubeSignerClient";
import contractAbi from "../abi/BridgeUsdc.json";
import Web3 from "web3";
import {BigNumber, ethers} from "ethers";
import {transferERC1155} from "./transferERC1155";

const AVAX_RPC_URL = process.env.AVAX_RPC_URL!;
const ETH_RPC_URL = process.env.ETH_RPC_URL!;
const USDC_CONTRACT_ABI = contractAbi.abi;
const USDC_CONTRACT_ADDRESS = contractAbi.address;

const web3Avax = new Web3(AVAX_RPC_URL);
const web3Eth = new Web3(ETH_RPC_URL);

export const handler = async (event: any) => {
  try {
    console.log(event);
    const {inventoryId,chain,tenantUserId,quantity}=event.arguments?.input;
    const tenant=event.identity.resolverContext as tenant
    const prisma = await getPrismaClient();
    const inventory=await prisma.productinventory.findFirst({
      where: {
        inventoryid: inventoryId
      }
    });
    if(!inventory) {
      return {
        status: 400,
        data: null,
        error: "Inventory not found"
      };
    }
    const payerKey = await getPayerCsSignerKey("Ethereum", tenant.id);
    const bigIntValue = ethers.utils.parseUnits((quantity*inventory.price).toString(), 18);

    const wallet=await getWalletByCustomer(tenantUserId,'Ethereum',tenant);
    if(!wallet?.walletaddress) {
      return {
        status: 400,
        data: null,
        error: "Wallet not found"
      };
    }
    if(!inventory?.tokenid) {
      return {
        status: 400,
        data: null,
        error: "TokenId not found"
      };
    }
    if(!inventory?.smartcontractaddress) {
      return {
        status: 400,
        data: null,
        error: "SmartContractAddress not found"
      };
    }
    if(!inventory?.quantity) {
      return {
        status: 400,
        data: null,
        error: "Quantity not found"
      };
    }

    const receipt=await transferUsdcIn(chain,tenant.id,payerKey.key?.materialId!,bigIntValue);
    const transferReceipt=await transferERC1155(wallet?.walletaddress!,parseInt(inventory.tokenid!),inventory.quantity,chain,inventory.smartcontractaddress!,tenant.id,"crypto",receipt.transactionHash.toString());

    return {
      status: 200,
      transactionHash: transferReceipt.transactionHash.toString(),
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

const transferUsdcIn=async(chain:string,tenantId:string,masterAddress:string,amount:BigNumber)=>{
  const web3 = chain === "AVAX" ? web3Avax : web3Eth;
  const payerKey = await getPayerCsSignerKey("Ethereum", tenantId);

  const contract = new web3.eth.Contract(USDC_CONTRACT_ABI, USDC_CONTRACT_ADDRESS);
  const currentNonce = await web3.eth.getTransactionCount(payerKey.key?.materialId!, "pending");
  const tx: any = {
    from: payerKey.key?.materialId,
    to: masterAddress,
    type: "0x02",
    maxPriorityFeePerGas: web3.utils.toWei("1", "gwei"), // Priority fee for miners
    maxFeePerGas: web3.utils.toWei("30", "gwei"), // Maximum fee you're willing to pay
    data: contract.methods.transfer(masterAddress, amount).encodeABI(),
    nonce: `0x${currentNonce.toString(16)}`
  };

  // Estimate gas for the transaction if needed
  const gasEstimate = await web3.eth.estimateGas(tx);
  tx.gas = `0x${gasEstimate.toString(16)}`;
  // Adjust the gas limit accordingly if required
  console.log(tx);

  const signedTx = await payerKey.key?.signEvm({ tx, chain_id: 43113 });
  const receipt = await web3.eth.sendSignedTransaction(signedTx?.data()?.rlp_signed_tx || "");
  return receipt
}
