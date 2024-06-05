import { getMasterWalletAddress } from "./dbFunctions";
import { tenant } from "./models";
import { solanaTransfer } from "./solanaTransfer";

export const handler = async (event: any) => {
  try {
    console.log(event);
    if (event.arguments?.input?.chainType === "Solana") {
      const receiverWallet = await getMasterWalletAddress(event.arguments?.input?.chainType,event.identity.resolverContext.id, event.arguments?.input?.symbol,
      );
      console.log("Receiver Wallet", receiverWallet);
      if(receiverWallet != null && receiverWallet != undefined){

      const data = await solanaTransfer(
        event.identity.resolverContext as tenant,
        event.arguments?.input?.senderWalletAddress,
        receiverWallet.walletaddress,
        event.arguments?.input?.amount,
        event.arguments?.input?.symbol,
        event.request?.headers?.identity,
        event.arguments?.input?.tenantUserId,
        event.arguments?.input?.chainType,
        event.arguments?.input?.tenantTransactionId

      );

      const response = {
        status: data?.transaction != null ? 200 : 400,
        data: data?.transaction,
        error: data?.error
      };
      console.log("Wallet", response);
      return response;
    
    }
    else{
      return {
        status: 400,
        data: null,
        error: "Master Wallet not found"
      };
    }
    } else {
      return {
        status: 400,
        data: null,
        error: "ChainType not supported"
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
