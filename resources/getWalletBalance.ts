import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "./models";
import { getWalletAndTokenByWalletAddress } from "./dbFunctions";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  GetProgramAccountsFilter,clusterApiUrl,
} from "@solana/web3.js";

// const SOLANA_RPC_PROVIDER = "https://api.devnet.solana.com";
const SOLANA_RPC_PROVIDER = "https://solana-devnet.g.alchemy.com/v2/JGP5GfDvdIUjAnAxrfaQVQbNHC9l0dMS"

export const handler = async (event: any) => {
  try {
    console.log(event);

    const wallet = await getBalance(
      event.identity as tenant,
      event.arguments?.walletAddress
    );

    return {
      status: 200,
      body: {
        data: wallet,
        error: null,
      },
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      body: {
        data: null,
        error: err,
      },
    };
  }
};

async function getBalance(
  tenant: tenant,
  walletAddress: string) {
  console.log("Wallet Address", walletAddress);

  try {
    const wallet = await getWalletAndTokenByWalletAddress(
      walletAddress,
      tenant
    );
    let balance = 0;
    console.log(wallet, "Wallet");
    for(const token of wallet){
      if (token.chaintype === "SOL") {
        balance = await getSolBalance(walletAddress);
        token.balance = balance;
      } else {
        balance = await getSplTokenBalance(
          walletAddress,
          token.contractaddress ? token.contractaddress : ""
        );
        token.balance = balance;
      }

    };

    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getSolBalance(address: string) {
  try {
    console.log("Address", address);
    const pubkey = new PublicKey(address);
    console.log("pubkey", pubkey);

    const connection = await getSolConnection();
    console.log(connection, "connection");
    console.log(await connection.getBalance(pubkey), "connection");

    const balance = (await connection.getBalance(pubkey)) / LAMPORTS_PER_SOL;
    console.log("Balance", balance);
    return balance;
  } catch (err) {
    console.log(err);
    //throw err;
    return 0;
  }
}

async function getSplTokenBalance(wallet: string, contractAddress: string) {
    try{
  
  wallet = "9CTUUQ17e2nghqswwLkNqazUw6pVDvUaWNo4wjWCPSwz";
  if (contractAddress === "") {
    return 0; //no contract address
  } else {
    const solanaConnection = await getSolConnection();
    const filters: GetProgramAccountsFilter[] = [
      {
        dataSize: 165, //size of account (bytes)
      },
      {
        memcmp: {
          offset: 32, //location of our query in the account (bytes)
          bytes: wallet, //our search criteria, a base58 encoded string
        },
      },
      {
        memcmp: {
          offset: 0, //number of bytes
          bytes: contractAddress, //base58 encoded string
        },
      },
    ];
    const accounts = await solanaConnection.getParsedProgramAccounts(
      new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      {
        filters: filters,
      }
    );
    console.log(
      `Found ${accounts.length} token account(s) for wallet ${wallet}.`
    );
    const parsedAccountInfo: any = accounts[0].account.data;
    console.log(parsedAccountInfo, "parsedAccountInfo");
    //const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
    const tokenBalance: number =
      parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
    return tokenBalance;
  }
}
catch(err){
  console.log(err);
  return 0;
}
}

async function getSolConnection() {
  // const connection = new Connection(SOLANA_RPC_PROVIDER, "confirmed");
  const connection = new Connection(clusterApiUrl("devnet"),"confirmed");
  return connection;
}
