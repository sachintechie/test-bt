import { getMasterWalletAddress, getTransactionByTenantTransactionId } from "../db/dbFunctions";
import { tenant } from "../db/models";
import { solanaTransfer } from "../solana/solanaTransfer";
import { logWithTrace } from "../utils/utils";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getTransactionByTenantTransactionId(
      event.arguments?.input?.tenantTransactionId,
      event.identity.resolverContext.id
    );
    if (!isTransactionAlreadyExist) {
      if (event.arguments?.input?.chainType === "Solana") {
        const receiverWallet = await getMasterWalletAddress(
          event.arguments?.input?.chainType,
          event.identity.resolverContext.id,
          event.arguments?.input?.symbol
        );
        logWithTrace("Receiver Wallet", receiverWallet);
        if (receiverWallet != null) {
          const data = await solanaTransfer(
            event.identity.resolverContext as tenant,
            event.arguments?.input?.senderWalletAddress,
            receiverWallet.walletaddress as string,
            event.arguments?.input?.amount,
            event.arguments?.input?.symbol,
            event.headers?.identity,
            event.arguments?.input?.tenantUserId,
            event.arguments?.input?.chainType,
            event.arguments?.input?.tenantTransactionId
          );

          const response = {
            status: data?.transaction != null ? 200 : 400,
            data: data?.transaction,
            error: data?.error
          };
          logWithTrace("Wallet", response);
          return response;
        } else {
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
    } else {
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
