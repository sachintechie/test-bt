import { tenant } from "./db/models";
import { getWalletAndTokenByWalletAddress } from "./db/dbFunctions";
import { getSolBalance, getSplTokenBalance } from "./solana/solanaFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const wallet = await getBalance(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.walletAddress,
      event.arguments?.input?.symbol
    );
    return {
      status: 200,
      data: wallet,
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

async function getBalance(tenant: tenant, walletAddress: string, symbol: string) {
  console.log("Wallet Address", walletAddress);

  try {
    const wallet = await getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol);
    let balance = 0;
    console.log(wallet, "Wallet");
    for (const token of wallet) {
      if (token.symbol === "SOL") {
        balance = await getSolBalance(walletAddress);
        token.balance = balance;
      } else {
        balance = await getSplTokenBalance(walletAddress, token.contractaddress ? token.contractaddress : "");
        token.balance = balance;
      }
    }
    return wallet;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
