import { avm, pvm, evm } from "@avalabs/avalanchejs";

export async function getAvaxBalance(address: string) {
  try {
    const pAddress: string = "P-" + address;
    const { avmapi, pvmapi } = await getAvaxConnection();
    const balanceRes = await pvmapi.getBalance({ addresses: [pAddress] });
    console.log(balanceRes);
    //let sendingAmount = parseFloat(amount.toString());
    let LAMPORTS_PER_AVAX = 10 ** 9;
    console.log("LAMPORTS_PER_SPLTOKEN", LAMPORTS_PER_AVAX);

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
