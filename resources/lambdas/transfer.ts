import { getTransactionByTenantTransactionId } from "../db/dbFunctions";
import { tenant } from "../db/models";
import { solanaTransfer } from "../solana/solanaTransfer";
import { provenanceTransfer } from "../provenance/commonFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getTransactionByTenantTransactionId(
      event.arguments?.input?.tenantTransactionId,
      event.identity.resolverContext.id
    );
    if (isTransactionAlreadyExist) {
      return {
        status: 400,
        data: null,
        error: "Transaction already exist"
      };
    }

    const chainType = event.arguments?.input?.chainType;

    if (chainType != "Solana" && chainType != "Provenance") {
      return {
        status: 400,
        data: null,
        error: "ChainType not supported"
      };
    }

    let data = null;

    if (chainType == "Solana") {
      data = await solanaTransfer(
        event.identity.resolverContext as tenant,
        event.arguments?.input?.senderWalletAddress,
        event.arguments?.input?.receiverWalletAddress,
        event.arguments?.input?.amount,
        event.arguments?.input?.symbol,
        event.headers?.identity,
        event.arguments?.input?.tenantUserId,
        event.arguments?.input?.chainType,
        event.arguments?.input?.tenantTransactionId
      );
    } else if (chainType === "Provenance") {
      data = await provenanceTransfer(
        event.identity.resolverContext as tenant,
        event.arguments?.input?.senderWalletAddress,
        event.arguments?.input?.receiverWalletAddress,
        event.arguments?.input?.amount,
        event.arguments?.input?.symbol,
        event.headers?.identity,
        event.arguments?.input?.tenantUserId,
        event.arguments?.input?.chainType,
        event.arguments?.input?.tenantTransactionId
      );
    }

    const response = {
      status: data?.transaction != null ? 200 : 400,
      data: data?.transaction,
      error: data?.error
    };
    console.log("Wallet", response);
    return response;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
