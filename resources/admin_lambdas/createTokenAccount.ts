import { getAdminTransactionByTenantTransactionId } from "../db/adminDbFunctions";
import { getTokenBySymbol } from "../db/dbFunctions";
import { tenant } from "../db/models";
import { createSplTokenAccounts } from "../solana/airdropSplToken";

export const handler = async (event: any) => {
  try {
    console.log(event);
    const isTransactionAlreadyExist = await getAdminTransactionByTenantTransactionId(
      event.arguments?.input?.tenantTransactionId,
      event.identity.resolverContext.id
    );
    if (isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined) {
      if (event.arguments?.input?.chainType === "Solana") {
        const data = await createTokenAccount(
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
          status: data?.tokenAccounts != null ? 200 : 400,
          data: data?.tokenAccounts,
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

async function createTokenAccount(
  tenant: tenant,
  senderWalletAddress: string,
  recipients: any,
  symbol: string,
  oidcToken: string,
  adminUserId: string,
  chainType: string,
  tenantTransactionId: string
) {
  try {
    const token = await getTokenBySymbol(symbol);
    console.log("Customer Wallets", recipients, "tenant", tenant, token, "token");
    if (token == null) {
      return {
        status: 400,
        data: null,
        error: "This token not supported at yet"
      };
    }
    if (recipients.length > 0 && tenant != null) {
      const blockchainTransaction = await createSplTokenAccounts(
        recipients,
        token?.decimalprecision ?? 0,
        chainType,
        token.contractaddress,
        oidcToken,
        senderWalletAddress,
        tenant
      );
      if (blockchainTransaction.tokenAccounts != null) {
        return { tokenAccounts: blockchainTransaction.tokenAccounts, error: null };
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
