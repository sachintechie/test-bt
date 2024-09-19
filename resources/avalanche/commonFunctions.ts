

import { avm, pvm, evm } from '@avalabs/avalanchejs';

export async function getAvaxBalance(address: string) {
  try{
 
    const pAddress: string = "P-" + address; 
    const { avmapi, pvmapi } = await getAvaxConnection();

    console.log(`Fetching balance for address: ${await pvmapi.getBalance({ addresses: [address] })}`);
    console.log(`Fetching balance for address: ${await pvmapi.getBalance({ addresses: [pAddress] })}`);

    console.log(`Fetching balance for address: ${pAddress}`);
    const { utxos } = await pvmapi.getUTXOs({ addresses: [address] });

console.log("P-Chain Balance:" + await pvmapi.getUTXOs({ addresses: [address] }));
console.log("P-Chain Balance:" + await pvmapi.getUTXOs({ addresses: [pAddress] }));

    const balance = utxos.toString();
    console.log(`P-Chain Balance: ${balance} nAVAX`);
  
    return Number.parseInt(balance);}
    catch (error) {
      console.error("Error fetching balance:", error);
      return 0;
    }
  }
  
  export async function getAvaxConnection() {
    const pvmapi = new pvm.PVMApi("https://api.avax-test.network/ext/bc/P");
    const avmapi = new avm.AVMApi("https://api.avax-test.network/ext/bc/P");

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
      const status = await pvmapi.getTxStatus({txID});
      console.log(`Transaction Status: ${status.status}`);
      return status;
    } catch (error) {
      console.error("Error fetching transaction status:", error);
      return null;
    }
  }