import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getStakeAccounts } from "./db/dbFunctions";
import { getSolConnection, getStakeAccountInfo } from "./solana/solanaFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const accounts = await getStakeAccounts(event.arguments?.input?.walletAddress, event.identity.resolverContext.id);
    if(accounts!=null){
      const connection = await getSolConnection();
    for (const account of accounts) {
      const stakeAccountInfo = await getStakeAccountInfo(account.stakeaccountpubkey, connection);


      console.log("Current Stake Amount", stakeAccountInfo, stakeAccountInfo.currentStakeAmount);
      if (stakeAccountInfo.currentStakeAmount == null) {

        account.amount = 0;
      } else{
        account.amount = stakeAccountInfo.currentStakeAmount / LAMPORTS_PER_SOL;
      }
     
    }
    return {
      status: 200,
      data: accounts,
      error: null
    };
  }
  else{
    return {
      status: 200,
      data: [],
      error: null
    };
  
  }
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
