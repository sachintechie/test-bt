import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant, TransactionStatus } from "../db/models";
import { getCubistConfig, getWalletAndTokenByWalletAddressBySymbol, insertTransaction } from "../db/dbFunctions";
import { oidcLogin } from "../cubist/CubeSignerClient";
import { logWithTrace } from "../utils/utils";
import { ProvenanceClient } from "./provenanceClient";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function provenanceTransfer(
  tenant: tenant,
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string
) {
  logWithTrace("Wallet Address", senderWalletAddress, symbol, "symbol");

  try {
    if (!oidcToken) {
      return {
        wallet: null,
        error: "Please provide an identity token for verification"
      };
    }

    const cubistConfig = await getCubistConfig(tenant.id);
    if (cubistConfig == null) {
      return {
        transaction: null,
        error: "Cubist Configuration not found for the given tenant"
      };
    }

    // Fetch the wallet and tokens owned by it
    const wallet = await getWalletAndTokenByWalletAddressBySymbol(senderWalletAddress, tenant, symbol);
    let balance = "0";
    logWithTrace(wallet, "Wallet");

    if (wallet.length == 0) {
      return {
        transaction: null,
        error: "Wallet not found for the given wallet address"
      };
    }

    // check if the token is available in the wallet
    const isTokenAvailable = wallet.some((token) => token.symbol == symbol && token.customerid != null);

    if (!isTokenAvailable) {
      return {
        transaction: null,
        error: "Token not found in the wallet"
      };
    }

    // Transfer Tokens on Provenance Chain

    // get the oidc client
    const oidcClient = await oidcLogin(env, cubistConfig.orgid, oidcToken, ["sign:*"]);

    if (!oidcClient) {
      return {
        trxHash: null,
        error: "Please send a valid identity token for verification"
      };
    }

    // fetch all the keys for the user
    const keys = await oidcClient.sessionKeys();

    // find the key that matches the wallet address
    const key = keys.find((key: cs.Key) => key.materialId === senderWalletAddress);

    if (!key) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of given wallet address"
      };
    }

    const provenanceClient = new ProvenanceClient("https://rpc.test.provenance.io:443/", key);

    // check if sender address has enough balance
    balance = await provenanceClient.getBalance(senderWalletAddress, symbol);

    if (Number(balance) < amount) {
      return {
        transaction: null,
        error: "Insufficient balance"
      };
    }

    try {
      const result = await provenanceClient.sendTokens(senderWalletAddress, receiverWalletAddress, amount.toString(), symbol);

      const transaction = await insertTransaction(
        senderWalletAddress,
        receiverWalletAddress,
        amount,
        chainType,
        symbol,
        result.data.transactionId,
        tenant.id,
        wallet[0].customerid,
        wallet[0].tokenid,
        tenantUserId,
        "Provenance",
        TransactionStatus.SUCCESS,
        tenantTransactionId
      );
      return {
        transaction: transaction,
        error: null
      };
    } catch (err) {
      return {
        transaction: null,
        error: err
      };
    }
  } catch (err) {
    return {
      transaction: null,
      error: err
    };
  }
}
