import { AvalancheUnstaking } from "../avalanche/stake";
import { getMasterValidatorNode, getStakeAccountById } from "../db/dbFunctions";
import { tenant } from "../db/models";
import { solanaUnStaking } from "../solana/solanaUnstake";
export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getStakeAccountById(event.arguments?.input?.stakeAccountId, event.identity.resolverContext.id);
    const masterValidatorNode = await getMasterValidatorNode(event.arguments?.input?.chainType);
    if (masterValidatorNode == null || masterValidatorNode == undefined) {
      return {
        status: 400,
        data: null,
        error: "Master Validator Node not found"
      };
    }
    if (isTransactionAlreadyExist != null) {
      if (event.arguments?.input?.chainType === "Solana") {
        console.log("Inside Solana", isTransactionAlreadyExist);
        const data = await solanaUnStaking(
          event.identity.resolverContext as tenant,
          event.arguments?.input?.stakeAccountId,
          isTransactionAlreadyExist.walletaddress,
          isTransactionAlreadyExist.stakeaccountpubkey,
          event.arguments?.input?.amount,
          isTransactionAlreadyExist.symbol,
          event.headers?.identity,
          isTransactionAlreadyExist.tenantuserid,
          event.arguments?.input?.chainType,
          isTransactionAlreadyExist.tenanttransactionid
        );

        const response = {
          status: data?.transaction != null ? 200 : 400,
          data: data?.transaction,
          error: data?.error
        };
        console.log("Wallet", response);
        return response;
      } else if (event.arguments?.input?.chainType === "Avalanche") {
        console.log("Inside Solana", isTransactionAlreadyExist);
        const data = await AvalancheUnstaking(
          event.identity.resolverContext as tenant,
          isTransactionAlreadyExist.walletaddress,
          event.arguments?.input?.amount,
          isTransactionAlreadyExist.symbol,
          event.headers?.identity,
          isTransactionAlreadyExist.tenantuserid,
          event.arguments?.input?.chainType,
          isTransactionAlreadyExist.tenanttransactionid,
          masterValidatorNode.validatornodeaddress || ""
        );

        const response = {
          status: data?.transaction != null ? 200 : 400,
          data: data?.transaction,
          error: data?.error
        };
        console.log("Wallet", response);
        return response;
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
        error: "Transaction not found"
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
