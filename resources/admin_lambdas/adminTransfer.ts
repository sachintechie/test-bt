import { getAdminTransactionByTenantTransactionId, insertAdminTransaction } from "../db/adminDbFunctions";
import {  getTokenBySymbol } from "../db/dbFunctions";
import { tenant, TransactionStatus } from "../db/models";
import { batchTransferSPLToken } from "../solana/airdropSplToken";
import { verifySolanaTransaction } from "../solana/solanaFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getAdminTransactionByTenantTransactionId(
      event.arguments?.input?.tenantTransactionId,
      event.identity.resolverContext.id
    );
    if (isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined) {
      if (event.arguments?.input?.chainType === "Solana") {
        const data = await adminTransfer(
          event.identity.resolverContext as tenant,
          event.arguments?.input?.senderWalletAddress,
          event.arguments?.input?.recipients,
          event.arguments?.input?.symbol,
          event.headers?.identity,
          event.arguments?.input?.adminUserId,
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


async function adminTransfer(tenant : tenant, senderWalletAddress : string, recipients : any, symbol : string, oidcToken : string, adminUserId : string, chainType : string, tenantTransactionId : string) {
  try {
  
    const token = await getTokenBySymbol(symbol);
    console.log("Customer Wallets", recipients, "tenant", tenant, token, "token");
    const amount = recipients.map((item : any) => Number(item.amount)).reduce((prev : any, curr : any) => prev + curr, 0);
    let recipientAddresses = "";
    const recipientAddress = recipients.map((item : any) => recipientAddresses += item.recipient + ",");
    console.log("Recipient Addresses", recipientAddresses);


    if (recipients.length > 0 && tenant != null && token != null) {
      if(recipients.length <= 10){
        return {
          status: 400,
          data: null,
          error: "Recipients should be more than 10"
        };
      }
      const blockchainTransaction = await batchTransferSPLToken(recipients, token?.decimalprecision ?? 0, chainType, token.contractaddress, oidcToken,senderWalletAddress,tenant);
      if (blockchainTransaction.trxHash != null) {
        const transactionStatus = await verifySolanaTransaction(blockchainTransaction.trxHash);
        const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

        const transaction = await insertAdminTransaction(
          senderWalletAddress,
          recipientAddresses,
          amount,
          chainType,
          symbol,
          blockchainTransaction.trxHash,
          tenant.id,
          adminUserId,
          token.id,
          process.env["SOLANA_NETWORK"] ?? "",
          txStatus,
          tenantTransactionId
        );
        return { transaction, error: null };
      } else {
        return {
          status: 400,
          data: null,
          error: blockchainTransaction.error
        };
      }
    } else {
      return {
        status: 200,
        data: "No Customers Found"
      };
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}