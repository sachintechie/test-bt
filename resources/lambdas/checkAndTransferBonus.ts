import { getAccount } from "@solana/spl-token";
import {
  getAllCustomerWalletForBonus,
  getAllTransactions,
  getTenantCallBackUrl,
  getTokenBySymbol,
  updateCustomerBonusStatus,
  updateTransaction
} from "../db/dbFunctions";
import { CallbackStatus, TransactionStatus } from "../db/models";
import { verifySolanaTransaction } from "../solana/solanaFunctions";
import { airdropSPLToken } from "../solana/airdropSplToken";

export const handler = async (event: any) => {
  try {
    const bonus = await transferBonus();
    return {
      status: 200,
      data: bonus,
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

async function transferBonus() {
  try {
    const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a";
    const tenant = await getTenantCallBackUrl(schoolhackTenantId);
    const customerWallets = await getAllCustomerWalletForBonus(schoolhackTenantId);
    const token = await getTokenBySymbol("SHC");
    console.log("Customer Wallets", customerWallets, "tenant", tenant, token, "token");
    if (customerWallets.length > 0) {
      const transaction = await airdropSPLToken(customerWallets, 1, token?.decimalprecision ?? 0, "Solana", token.contractaddress, tenant);
      if (transaction.trxHash != null) {
        const transactionStatus = await verifySolanaTransaction(transaction.trxHash);
        const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
        for (const customer of customerWallets){
          const updatedCustomer = await updateCustomerBonusStatus(customer.customerid, "true", tenant.id);
        }
        return transaction;
      } else {
        return {
          status: 200,
          data: "Transaction Failed",
          error: null
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
