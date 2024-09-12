import { Avalanche, BinTools, Buffer } from "avalanche";
import { AVMAPI } from "avalanche/dist/apis/avm";
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm";



export async function getAvaxBalance(address: string) {
    const pAddress: string = address; 
    const { xchain, pchain } = await getAvaxConnection();
    const balanceResponse = await pchain.getBalance(pAddress);
    const balance = balanceResponse.balance;
    console.log(`P-Chain Balance: ${balance} nAVAX`);
    return balance;
  }

  export async function getAvaxConnection() {
    const ip: string = "api.avax.network";
    const port: number = 443;
    const protocol: string = "https";
    const networkID: number = 1; // Mainnet ID is 1
    const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
    const xchain: AVMAPI = avalanche.XChain();
    const pchain: PlatformVMAPI = avalanche.PChain();
    return { xchain, pchain, networkID };
  }

  export async function verifyAvalancheTransaction(txID: string) {
    try {
        const { pchain } = await getAvaxConnection();
      const status = await pchain.getTxStatus(txID);
      console.log(`Transaction Status: ${status}`);
      return status;
    } catch (error) {
      console.error("Error fetching transaction status:", error);
      return null;
    }
  }