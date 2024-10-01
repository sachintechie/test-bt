import { Connection, LAMPORTS_PER_SOL, PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";

const SOLANA_NETWORK_URL = process.env["SOLANA_NETWORK_URL"] ?? "https://api.devnet.solana.com"; // Use 'https://api.mainnet-beta.solana.com' for mainnet

export async function getSolConnection() {
  console.log(SOLANA_NETWORK_URL);

  const connection = new Connection(SOLANA_NETWORK_URL, "finalized");
  // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  return connection;
}

export async function verifySolanaTransaction(txId: string) {
  try{
  const connection = await getSolConnection();
  const result = await connection.getSignatureStatus(txId, {
    searchTransactionHistory: true
  });
  console.log(result);
  return result.value?.confirmationStatus;
}
catch(err){
  console.log("error in verify solana transaction" + err);
  return null;
}
}
export async function getSolBalance(address: string) {
  try {
    const pubkey = new PublicKey(address);
    const connection = await getSolConnection();
    const balance = (await connection.getBalance(pubkey)) / LAMPORTS_PER_SOL;
    return balance;
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export async function getSplTokenBalance(wallet: string, contractAddress: string) {
  try {
    if (contractAddress === "") {
      return 0; //no contract address
    } else {
      const solanaConnection = await getSolConnection();
      const filters: GetProgramAccountsFilter[] = [
        {
          dataSize: 165 //size of account (bytes)
        },
        {
          memcmp: {
            offset: 32, //location of our query in the account (bytes)
            bytes: wallet //our search criteria, a base58 encoded string
          }
        },
        {
          memcmp: {
            offset: 0, //number of bytes
            bytes: contractAddress //base58 encoded string
          }
        }
      ];
      const accounts = await solanaConnection.getParsedProgramAccounts(new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
        filters: filters
      });
      console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
      const parsedAccountInfo: any = accounts[0].account.data;
      console.log(parsedAccountInfo, "parsedAccountInfo");
      //const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
      const tokenBalance: number = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
      return tokenBalance;
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
}

export async function getStakeAccountInfo(stakeAccountPubKey: string, connection: Connection) {
  const stakeAccountPubkey = new PublicKey(stakeAccountPubKey);
  const stakeAccountInfo = await connection.getParsedAccountInfo(stakeAccountPubkey);
  const stakeAccountData = stakeAccountInfo.value?.data;
  if (!stakeAccountData || !("parsed" in stakeAccountData)) {
    return { currentStakeAmount: null, error: "Failed to parse stake account data" };
  }
  const stakeAccount = stakeAccountData.parsed.info;
  console.log(stakeAccount);

  const currentStakeAmount = stakeAccount.stake?.delegation?.stake ?? 0;
  return { currentStakeAmount, error: null };
}
