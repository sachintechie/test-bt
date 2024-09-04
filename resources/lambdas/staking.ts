import { getStakingTransactionByTenantTransactionId,getMasterValidatorNode } from "../db/dbFunctions";
import { tenant } from "../db/models";
import { solanaStaking } from "../solana/solanaStake";
export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getStakingTransactionByTenantTransactionId(
      event.arguments?.input?.tenantTransactionId,
      event.identity.resolverContext.id
    );

    const masterValidatorNode = await getMasterValidatorNode( event.arguments?.input?.chainType);
    if(masterValidatorNode == null || masterValidatorNode == undefined){
      return {
        status: 400,
        data: null,
        error: "Master Validator Node not found"
      }
    }

    if (isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined) {
      if (event.arguments?.input?.chainType === "Solana") {
        const data = await solanaStaking(
          event.identity.resolverContext as tenant,
          event.arguments?.input?.senderWalletAddress,
          masterValidatorNode.validatornodeaddress || "",
          event.arguments?.input?.amount,
          event.arguments?.input?.symbol,
          event.headers?.identity,
          event.arguments?.input?.tenantUserId,
          event.arguments?.input?.chainType,
          event.arguments?.input?.tenantTransactionId,
          event.arguments?.input?.lockupExpirationTimestamp
        );

        const response = {
          status: data?.transaction != null ? 200 : 400,
          data: data?.transaction,
          error: data?.error
        };
        console.log("Wallet", response);
        return response;
      }
      if (event.arguments?.input?.chainType === "Avalanche") {
        const data = await solanaStaking(
          event.identity.resolverContext as tenant,
          event.arguments?.input?.senderWalletAddress,
          masterValidatorNode.validatornodeaddress || "",
          event.arguments?.input?.amount,
          event.arguments?.input?.symbol,
          event.headers?.identity,
          event.arguments?.input?.tenantUserId,
          event.arguments?.input?.chainType,
          event.arguments?.input?.tenantTransactionId,
          event.arguments?.input?.lockupExpirationTimestamp
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
