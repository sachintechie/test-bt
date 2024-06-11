import { getTransactionByTenantTransactionId } from "./dbFunctions";
import { tenant } from "./models";
import { solanaTransfer } from "./solanaTransfer";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getTransactionByTenantTransactionId(event.arguments?.input?.tenantTransactionId,event.identity.resolverContext.id);
    if(isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined){
      if (event.arguments?.input?.chainType === "Solana") {
      
      const data = await solanaTransfer(
        event.identity.resolverContext as tenant,
        event.arguments?.input?.senderWalletAddress,
        event.arguments?.input?.receiverWalletAddress,
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
    else {
      return {
        status: 400,
        data: null,
        error: "ChainType not supported"
      };
    }
  }
  else{
    return {
      status: 400,
      data: null,
      error: "Transaction already exist"
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


