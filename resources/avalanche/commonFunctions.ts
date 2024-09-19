import { AVMAPI } from "avalanche/dist/apis/avm";
import { PlatformVMAPI } from "avalanche/dist/apis/platformvm";

import { Avalanche, Buffer, BinTools } from 'avalanche';
export async function getAvaxBalance(address: string) {
  try{
    const pAddress: string = "P-" + address; 
    console.log(`Fetching balance for address: ${pAddress}`);
    const { xchain, pchain } = await getAvaxConnection();
  
console.log("P-Chain Balance:" + await pchain.getBalance(address));
console.log("P-Chain Balance:" + await pchain.getBalance(pAddress));

    const balanceResponse = await pchain.getTx(pAddress);
    const balance = balanceResponse.toString();
    console.log(`P-Chain Balance: ${balance} nAVAX`);
    const balanceres = await pchain.getTx(address);
    console.log("P-Chain Balance:" + balanceres);
  
    return Number.parseInt(balance);}
    catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }
  
  export async function getAvaxConnection() {
    const avalanche = new Avalanche('testnet'); // Connect to Avalanche testnet
    // const ip: string = process.env["AVAX_URL"]! // Testnet URL
    // const port: number = 443; 
    // const protocol: string = "https";
     const AVAX_NETWORK_ID: string = process.env["AVAX_NETWORK_ID"]!; 
     const networkID: number = Number.parseInt(AVAX_NETWORK_ID); 
  //  const avalanche: Avalanche = new Avalanche(ip, port, protocol, networkID);
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