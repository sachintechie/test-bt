import { PrismaClient, Prisma } from "@prisma/client";
import {
  AuthType,
  CallbackStatus,
  customer,
  StakeAccountStatus,
  tenant,
  updatecustomer,
  productfilter,
  orders,
  orderstatus,
  productreview,
  createcollection,
  addtocollection,
  productRarity,
  ProductStatus,
  ProductFindBy
} from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { getDatabaseUrl } from "./PgClient";
import { logWithTrace } from "../utils/utils";

let prismaClient: PrismaClient;

export async function getPrismaClient() {
  if (prismaClient) {
    return prismaClient;
  }
  const databaseUrl = await getDatabaseUrl();
  prismaClient = new PrismaClient({
    datasourceUrl: databaseUrl,
    log: ["query", "info", "warn", "error"]
  });

  // @ts-ignore
  prismaClient.$on("query", (e: any) => {
    console.log("Query: ", e.query);
    console.log("Params: ", e.params);
    console.log("Duration: ", e.duration, "ms");
  });

  return prismaClient;
}

export async function getWalletByChainType(chainType: string) {
  try {
    const prisma = await getPrismaClient();
    const wallets = await prisma.wallet.findMany({
      where: {
        chaintype: chainType
      }
    });
    return wallets ? wallets : null;
  } catch (err) {
    throw err;
  }
}

export async function getWalletByWalletType(chainType: string) {
  try {
    const prisma = await getPrismaClient();
    const wallets = await prisma.wallet.findMany({
      where: {
        chaintype: chainType
      }
    });
    return wallets ? wallets : null;
  } catch (err) {
    throw err;
  }
}

function sanitizeData(data: any) {
  for (const key in data) {
    if (typeof data[key] === "string") {
      data[key] = data[key].replace(/\x00/g, ""); // Remove null bytes
    } else if (typeof data[key] === "object" && data[key] !== null) {
      sanitizeData(data[key]); // Recursively sanitize nested objects
    }
  }
}

export async function createCustomer(customer: customer) {
  try {
    const prisma = await getPrismaClient();
    const newCustomer = await prisma.customer.create({
      data: {
        tenantuserid: customer.tenantuserid,
        tenantid: customer.tenantid as string,
        emailid: customer.emailid,
        name: customer.name,
        iss: customer.iss,
        cubistuserid: customer.cubistuserid?.toString(),
        isbonuscredit: customer.isBonusCredit,
        isactive: customer.isactive,
        partialtoken: customer.partialtoken,
        usertype: customer.usertype,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }
    });
    return newCustomer;
  } catch (err) {
    throw err;
  }
}

export async function updateCustomer(customer: updatecustomer) {
  try {
    const prisma = await getPrismaClient();
    const newCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        partialtoken: customer.partialtoken,
        updatedat: customer.updatedat
      }
    });
    return newCustomer;
  } catch (err) {
    throw err;
  }
}

export async function updateCustomerCubistData(customer: updatecustomer) {
  try {
    const prisma = await getPrismaClient();
    const newCustomer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        cubistuserid: customer.cubistuserid,
        emailid: customer.emailid,
        iss: customer.iss
      }
    });
    return newCustomer;
  } catch (err) {
    throw err;
  }
}

export async function createWalletAndKey(org: any, cubistUserId: string, chainType: string, customerId: string, key?: any) {
  try {
    const prisma = await getPrismaClient();
    console.log("Creating wallet", cubistUserId, customerId, key);
    if (key == null) {
      key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
    }

    logWithTrace("Created key", key.materialId);
    const newWallet = await prisma.wallet.create({
      data: {
        customerid: customerId as string,
        walletaddress: key.materialId,
        walletid: key.id,
        chaintype: chainType,
        wallettype: cs.Ed25519.Solana.toString(),
        isactive: true,
        createdat: new Date().toISOString()
      }
    });

    console.log("Created wallet", newWallet);

    return { data: newWallet, error: null };
  } catch (err) {
    throw err;
  }
}
export async function createWallet(org: cs.Org, cubistUserId: string, chainType: string, customerId?: string) {
  try {
    console.log("Creating wallet", cubistUserId, chainType);
    var keyType: any;
    switch (chainType) {
      case "Ethereum":
        keyType = cs.Secp256k1.Evm;
        break;
      case "Bitcoin":
        keyType = cs.Secp256k1.Btc;
        break;
      case "Avalanche":
        keyType = cs.Secp256k1.AvaTest;
        break;
      case "Cardano":
        keyType = cs.Ed25519.Cardano;
        break;
      case "Solana":
        keyType = cs.Ed25519.Solana;
        break;
      case "Stellar":
        keyType = cs.Ed25519.Stellar;
        break;
      default:
        keyType = null;
    }
    console.log("Creating wallet", keyType);
    if (keyType != null) {
      const key = await org.createKey(keyType, cubistUserId);

      // if (keyType == cs.Ed25519.Solana) {
      //   const role = await org.getRole(OPERATION_ROLE_ID);
      //   role.addKey(key);
      // }
      const prisma = await getPrismaClient();
      const newWallet = await prisma.wallet.create({
        data: {
          customerid: customerId as string,
          walletaddress: key.materialId,
          walletid: key.id,
          chaintype: chainType,
          wallettype: keyType.toString(),
          isactive: true,
          createdat: new Date().toISOString()
        }
      });
      return { data: newWallet, error: null };
    } else {
      return { data: null, error: "Chain type not supported for key generation" };
    }
  } catch (err) {
    throw err;
  }
}

export async function insertTransaction(
  senderWalletAddress: string,
  receiverWalletaddress: string,
  amount: number,
  chainType: string,
  symbol: string,
  txhash: string,
  tenantId: string,
  customerId: string,
  tokenId: string,
  tenantUserId: string,
  network: string,
  status: string,
  tenantTransactionId: string,
  error?: string
) {
  try {
    const prisma = await getPrismaClient();
    const newTransaction = await prisma.transaction.create({
      data: {
        customerid: customerId,
        callbackstatus: CallbackStatus.PENDING,
        tokenid: tokenId,
        tenanttransactionid: tenantTransactionId,
        network: network,
        status: status,
        error: error as string,
        tenantuserid: tenantUserId,
        walletaddress: senderWalletAddress,
        receiverwalletaddress: receiverWalletaddress,
        chaintype: chainType,
        amount: amount,
        symbol: symbol,
        txhash: txhash,
        tenantid: tenantId,
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }
    });
    return { ...newTransaction, transactionid: newTransaction.id };
  } catch (err) {
    throw err;
  }
}

export async function insertStakingTransaction(
  senderWalletAddress: string,
  receiverWalletaddress: string,
  amount: number,
  chainType: string,
  symbol: string,
  txhash: string,
  tenantId: string,
  customerId: string,
  tokenId: string,
  tenantUserId: string,
  network: string,
  status: string,
  tenantTransactionId: string,
  stakeaccountpubkey: string,
  stakeaccountid: string,
  stakeType: string,
  error?: string
) {
  try {
    const prisma = await getPrismaClient();
    const newStaketransaction = await prisma.staketransaction.create({
      data: {
        customerid: customerId,
        type: stakeType,
        tokenid: tokenId,
        tenanttransactionid: tenantTransactionId,
        stakeaccountpubkey: stakeaccountpubkey,
        network: network,
        status: status,
        error: error as string,
        tenantuserid: tenantUserId,
        walletaddress: senderWalletAddress,
        receiverwalletaddress: receiverWalletaddress,
        chaintype: chainType,
        amount: amount,
        symbol: symbol,
        txhash: txhash,
        tenantid: tenantId,
        isactive: true,
        stakeaccountid: stakeaccountid,
        createdat: new Date().toISOString()
      }
    });
    return { ...newStaketransaction, transactionid: newStaketransaction.id };
  } catch (err) {
    throw err;
  }
}
export async function insertStakeAccount(
  senderWalletAddress: string,
  receiverWalletaddress: string,
  amount: number,
  chainType: string,
  symbol: string,
  tenantId: string,
  customerId: string,
  tenantUserId: string,
  network: string,
  status: string,
  tenantTransactionId: string,
  stakeaccountpubkey: string,
  tokenid: string,
  lockupExpirationTimestamp: number,
  error?: string
) {
  try {
    const prisma = await getPrismaClient();
    console.log(
      "Creating stake account",
      senderWalletAddress,
      receiverWalletaddress,
      amount,
      chainType,
      symbol,
      tenantId,
      customerId,
      tenantUserId,
      network,
      status,
      tenantTransactionId,
      stakeaccountpubkey,
      lockupExpirationTimestamp,
      error
    );
    const newStakeaccount = await prisma.stakeaccount.create({
      data: {
        customerid: customerId,
        walletaddress: senderWalletAddress,
        tokenid: tokenid,
        validatornodeaddress: receiverWalletaddress,
        amount: amount,
        chaintype: chainType,
        symbol: symbol,
        tenantid: tenantId,
        tenantuserid: tenantUserId,
        network: network,
        status: status,
        tenanttransactionid: tenantTransactionId,
        stakeaccountpubkey: stakeaccountpubkey,
        lockupexpirationtimestamp: lockupExpirationTimestamp,
        isactive: true,
        error: error,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }
    });
    return { ...newStakeaccount, stakeaccountid: newStakeaccount.id };
  } catch (err) {
    throw err;
  }
}

export async function insertCustomerKyc(customerKyc: any, kycType: string, tenantId: string, error?: string) {
  try {
    const prisma = await getPrismaClient();
    const newCustomerKyc = await prisma.customerkyc.create({
      data: {
        customerid: customerKyc.externalUserId,
        kyctype: kycType,
        type: customerKyc.type,
        kycid: customerKyc.id,
        status: customerKyc.review.reviewStatus,
        error: error as string,
        tenantid: tenantId,
        isactive: true,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }
    });
    return newCustomerKyc;
  } catch (err) {
    throw err;
  }
}

export async function mergeDbStakeAccounts(targetStakeAccountPubkey: string, sourceStakeAccountPubkey: string) {
  try {
    const prisma = await getPrismaClient();
    const sourceAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: sourceStakeAccountPubkey }
    });

    if (!sourceAccount) {
      throw new Error("Source stake account not found");
    }

    const targetAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: targetStakeAccountPubkey }
    });

    if (!targetAccount) {
      throw new Error("Target stake account not found");
    }

    const newAmount = (sourceAccount.amount || 0) + (targetAccount.amount || 0);

    const updatedTargetAccount = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: sourceStakeAccountPubkey },
      data: { amount: newAmount }
    });

    const updatetargetStakeAccountPubkey = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: targetStakeAccountPubkey },
      data: { status: StakeAccountStatus.MERGED, amount: 0 }
    });

    return { updatedTargetAccount, updatetargetStakeAccountPubkey };
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function updateStakeAccount(stakeaccountpubkey: string, status: string) {
  try {
    const prisma = await getPrismaClient();
    const deletedStakeAccount = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: stakeaccountpubkey },
      data: { status: status }
    });

    return deletedStakeAccount;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function removeStakeAccount(stakeaccountpubkey: string) {
  try {
    const prisma = await getPrismaClient();
    const deletedStakeAccount = await prisma.stakeaccount.deleteMany({
      where: { stakeaccountpubkey: stakeaccountpubkey }
    });

    return deletedStakeAccount;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function insertMergeStakeAccountsTransaction(
  targetStakeAccountPubkey: string,
  sourceStakeAccountPubkey: string,
  txhash: string
) {
  try {
    const prisma = await getPrismaClient();
    const sourceAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: sourceStakeAccountPubkey }
    });

    if (!sourceAccount) {
      throw new Error("Source stake account not found");
    }

    const targetAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: targetStakeAccountPubkey }
    });

    if (!targetAccount) {
      throw new Error("Target stake account not found");
    }

    const newAmount = (sourceAccount.amount || 0) + (targetAccount.amount || 0);

    await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: targetStakeAccountPubkey },
      data: { status: StakeAccountStatus.MERGED, updatedat: new Date().toISOString() }
    });

    const sourceStakeTransaction = await prisma.staketransaction.findFirst({
      where: { stakeaccountid: sourceAccount.id }
    });

    const mergeTransaction = await prisma.staketransaction.create({
      data: {
        customerid: targetAccount.customerid,
        type: "MERGE",
        tokenid: sourceStakeTransaction?.tokenid!,
        tenanttransactionid: targetAccount.tenanttransactionid,
        stakeaccountpubkey: targetStakeAccountPubkey,
        network: targetAccount.network,
        status: "SUCCESS",
        tenantuserid: targetAccount.tenantuserid,
        walletaddress: targetAccount.walletaddress,
        receiverwalletaddress: targetAccount.walletaddress,
        chaintype: targetAccount.chaintype,
        amount: newAmount,
        symbol: targetAccount.symbol,
        txhash: txhash,
        tenantid: targetAccount.tenantid,
        isactive: true,
        stakeaccountid: sourceAccount.id,
        createdat: new Date().toISOString()
      }
    });

    return mergeTransaction;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function createWithdrawTransaction(stakeaccountpubkey: string, txhash: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: stakeaccountpubkey }
    });

    if (!stakeAccount) {
      throw new Error("Stake account not found");
    }

    const sourceStakeTransaction = await prisma.staketransaction.findFirst({
      where: { stakeaccountid: stakeAccount.id }
    });

    const stakeTransaction = await prisma.staketransaction.create({
      data: {
        customerid: stakeAccount.customerid,
        type: "withdraw",
        tokenid: stakeAccount.tokenid,
        tenanttransactionid: stakeAccount.tenanttransactionid,
        stakeaccountpubkey: stakeaccountpubkey,
        stakeaccountid: stakeAccount.id,
        network: stakeAccount.network,
        status: "pending",
        tenantuserid: stakeAccount.tenantuserid,
        walletaddress: stakeAccount.walletaddress,
        receiverwalletaddress: stakeAccount.stakeaccountpubkey,
        chaintype: stakeAccount.chaintype,
        amount: stakeAccount.amount,
        symbol: stakeAccount.symbol,
        txhash: txhash,
        tenantid: stakeAccount.tenantid,
        isactive: true,
        createdat: new Date().toISOString()
      }
    });
    return stakeTransaction;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getStakeAccounData(stakeAccountPubKey: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeAccounts = await prisma.stakeaccount.findFirst({
      where: {
        stakeaccountpubkey: stakeAccountPubKey,
        tenantid: tenantId
      }
    });

    return stakeAccounts ? stakeAccounts : null;
  } catch (err) {
    throw err;
  }
}

export async function getStakeAccounts(senderWalletAddress: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeAccounts = await prisma.stakeaccount.findMany({
      where: {
        walletaddress: senderWalletAddress,
        tenantid: tenantId
      }
    });

    return stakeAccounts.length > 0 ? stakeAccounts : null;
  } catch (err) {
    throw err;
  }
}
export async function getMasterValidatorNode(chainType: string) {
  try {
    const prisma = await getPrismaClient();
    const validatorNode = await prisma.validatornodes.findFirst({
      where: {
        ismaster: true,
        chaintype: chainType
      }
    });

    return validatorNode ? validatorNode : null;
  } catch (err) {
    throw err;
  }
}

export async function getStakeAccount(senderWalletAddress: string, tenantId: string, customerId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeAccount = await prisma.stakeaccount.findFirst({
      where: {
        walletaddress: senderWalletAddress,
        customerid: customerId,
        tenantid: tenantId
      }
    });

    return stakeAccount ? stakeAccount : null;
  } catch (err) {
    throw err;
  }
}
export async function getCustomerKycByTenantId(customerId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customerKyc = await prisma.customerkyc.findFirst({
      where: {
        customerid: customerId,
        tenantid: tenantId
      }
    });

    return customerKyc ? customerKyc : null;
  } catch (err) {
    throw err;
  }
}

export async function getCustomerKyc(customerId: string) {
  try {
    const prisma = await getPrismaClient();
    const customerKyc = await prisma.customerkyc.findFirst({
      where: {
        customerid: customerId
      }
    });

    return customerKyc ? customerKyc : null;
  } catch (err) {
    throw err;
  }
}

export async function getWalletByCustomer(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.customer.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenant.id
      },
      include: {
        wallets: {
          where: {
            chaintype: chaintype
          }
        }
      }
    });
    if (wallet?.wallets.length == 0 || wallet == null) return null;
    const newWallet = {
      walletaddress: wallet?.wallets[0].walletaddress,
      createdat: wallet?.wallets[0].createdat,
      chaintype: wallet?.wallets[0].chaintype,
      tenantuserid: wallet?.tenantuserid,
      tenantid: tenant.id,
      emailid: wallet?.emailid,
      customerid: wallet?.id
    };

    return newWallet ? newWallet : null;
  } catch (err) {
    throw err;
  }
}

export async function getCustomerAndWallet(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.customer.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenant.id
      },
      include: {
        wallets: {
          where: {
            chaintype: chaintype
          }
        }
      }
    });
    if (wallet == null) return null;
    return wallet ? wallet : null;
  } catch (err) {
    throw err;
  }
}

export async function getCustomerAndWalletByAuthType(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const customer = await prisma.customer.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenant.id
      },
      include: {
        wallets: {
          where: {
            chaintype: chaintype
          }
        }
      }
    });
    if (customer == null) return null;
    return customer ? customer : null;
  } catch (err) {
    throw err;
  }
}

export async function getPayerWallet(chaintype: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const payerWallet = await prisma.gaspayerwallet.findFirst({
      where: {
        tenantid: tenantId,
        symbol: chaintype
      }
    });

    return payerWallet ? payerWallet : null;
  } catch (err) {
    throw err;
  }
}
export async function getMasterWalletAddress(chaintype: string, tenantId: string, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const masterWallet = await prisma.masterwallet.findFirst({
      where: {
        tenantid: tenantId,
        chaintype: chaintype,
        symbol: symbol
      }
    });

    return masterWallet ? masterWallet : null;
  } catch (err) {
    throw err;
  }
}

export async function getTransactionByTenantTransactionId(tenantTransactionId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const transaction = await prisma.transaction.findFirst({
      where: {
        tenantid: tenantId,
        tenanttransactionid: tenantTransactionId
      }
    });

    return transaction ? transaction : null;
  } catch (err) {
    throw err;
  }
}

export async function getStakingTransactionByStakeAccountId(stakeAccountId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakingTransaction = await prisma.staketransaction.findFirst({
      where: {
        tenantid: tenantId,
        stakeaccountid: stakeAccountId
      }
    });

    return stakingTransaction ? stakingTransaction : null;
  } catch (err) {
    throw err;
  }
}

export async function getStakeAccountById(stakeAccountId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeAccount = await prisma.stakeaccount.findFirst({
      where: {
        tenantid: tenantId,
        id: stakeAccountId
      }
    });

    return stakeAccount ? stakeAccount : null;
  } catch (err) {
    throw err;
  }
}

export async function getWalletAndTokenByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.wallet.findFirst({
      where: {
        walletaddress: walletAddress
      }
    });
    let tokens;
    if (symbol == null || symbol == "") {
      tokens = await prisma.token.findMany({
        where: { chaintype: wallet?.chaintype || "" }
      });
    } else {
      tokens = await prisma.token.findMany({
        where: { chaintype: wallet?.chaintype || "", symbol: symbol }
      });
    }

    const walletsWithChainTypePromises = tokens.map(async (t: any) => {
      const wallet = await prisma.wallet.findFirst({
        where: { chaintype: t.chaintype, walletaddress: walletAddress }
      });
      return { ...t, ...wallet, tokenname: t.name, tokenid: t.id };
    });
    return await Promise.all(walletsWithChainTypePromises);
  } catch (err) {
    throw err;
  }
}

export async function getWalletAndTokenByWalletAddressBySymbol(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.wallet.findFirst({
      where: {
        walletaddress: walletAddress
      }
    });
    const tokens = await prisma.token.findMany({
      where: { chaintype: wallet?.chaintype || "", symbol: symbol }
    });
    const walletsWithChainTypePromises = tokens.map(async (t: any) => {
      const wallet = await prisma.wallet.findFirst({
        where: { chaintype: t.chaintype, walletaddress: walletAddress }
      });
      return { ...t, ...wallet, tokenname: t.name, tokenid: t.id };
    });
    return await Promise.all(walletsWithChainTypePromises);
  } catch (err) {
    throw err;
  }
}

export async function getWallet(walletAddress: string) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.wallet.findFirst({
      where: { walletaddress: walletAddress }
    });
    return wallet;
  } catch (err) {
    throw err;
  }
}

export async function getToken(symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const token = await prisma.token.findFirst({
      where: { symbol: symbol }
    });

    return token;
  } catch (err) {
    throw err;
  }
}

export async function getTokenBySymbol(symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const token = await prisma.token.findFirst({
      where: { symbol: symbol }
    });

    return token;
  } catch (err) {
    throw err;
  }
}

export async function getFirstWallet(walletAddress: string, tenant: tenant, symbol: string) {
  const wallet = await getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol);
  if (wallet.length == 0) return null;
  return wallet[0];
}

export async function getCustomerWalletsByCustomerId(customerid: string, tenant: tenant) {
  try {
    const prisma = await getPrismaClient();

    const chainType = await prisma.chaintype.findMany({});
    var newWallet = [];
    for (const chain of chainType) {
      //  chainType.forEach((chain: any) => {
      const wallet = await prisma.wallet.findFirst({
        where: { customerid: customerid, chaintype: chain?.chain }
      });
      console.log(wallet);

      const walletData = {
        chaintype: chain?.chain,
        walletaddress: wallet?.walletaddress,
        wallettype: wallet?.wallettype,
        symbol: chain?.symbol,
        createdat: wallet?.createdat,
        customerid: wallet?.customerid
      };
      console.log(walletData);

      newWallet.push(walletData);
    }
    return newWallet;
  } catch (err) {
    throw err;
  }
}

export async function CustomerAndWalletCounts(tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.wallet.count({});

    //const customer = await prisma.customer.count({where:{tenantid:tenant.id}});
    return { wallet };
  } catch (err) {
    throw err;
  }
}

export async function getTransactionsByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const transactions = await prisma.transaction.findMany({
      where: {
        walletaddress: walletAddress,
        tenantid: tenant.id
      }
    });
    const token = await prisma.token.findFirst({
      where: {
        symbol: symbol
      }
    });
    return transactions.map((t: any) => {
      return { ...t, ...(token || {}) };
    });
  } catch (err) {
    throw err;
  }
}

export async function getStakeTransactions(stakeaccountid: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakeTransactions = await prisma.staketransaction.findMany({
      where: {
        stakeaccountid: stakeaccountid,
        tenantid: tenantId
      }
    });

    return stakeTransactions;
  } catch (err) {
    throw err;
  }
}

export async function getAllTransactions() {
  try {
    const prisma = await getPrismaClient();
    const transactions = await prisma.transaction.findMany({
      where: {
        status: "PENDING"
      }
    });
    return transactions;
  } catch (err) {
    throw err;
  }
}

export async function getAllCustomerWalletForBonus(tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const wallets = await prisma.customer.findMany({
      where: {
        isbonuscredit: false,
        tenantid: tenantId
      },
      include: {
        wallets: {
          where: {
            chaintype: "Solana"
          }
        }
      },
      take: 10
    });
    return wallets;
  } catch (err) {
    throw err;
  }
}

export async function getAllCustomerAndWalletByTenant(tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customers = await prisma.customer.findMany({
      where: {
        tenantid: tenantId
      },
      include: {
        wallets: true
      }
    });
    return customers;
  } catch (err) {
    throw err;
  }
}

export async function getAllStakingTransactions() {
  try {
    const prisma = await getPrismaClient();
    const stakingTransactions = await prisma.staketransaction.findMany({
      where: {
        status: "PENDING"
      }
    });
    return stakingTransactions;
  } catch (err) {
    throw err;
  }
}

export async function getTenantCallBackUrl(tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    return tenant;
  } catch (err) {
    throw err;
  }
}

export async function getCubistConfig(tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const cubistConfig = await prisma.cubistconfig.findFirst({
      where: { tenantid: tenantId }
    });
    return cubistConfig;
  } catch (err) {
    throw err;
  }
}

export async function getMasterSumsubConfig() {
  try {
    const prisma = await getPrismaClient();
    const sumsubConfig = await prisma.sumsubconfig.findFirst({
      where: { ismaster: true }
    });
    return sumsubConfig;
  } catch (err) {
    throw err;
  }
}

export async function updateTransaction(transactionId: string, status: string, callbackStatus: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: status,
        callbackstatus: callbackStatus,
        updatedat: new Date().toISOString()
      }
    });
    return updatedTransaction;
  } catch (err) {
    throw err;
  }
}

export async function updateCustomerKycStatus(customerId: string, status: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedCustomerKyc = await prisma.customerkyc.updateMany({
      where: { customerid: customerId },
      data: {
        status: status,
        updatedat: new Date().toISOString()
      }
    });
    return updatedCustomerKyc;
  } catch (err) {
    throw err;
  }
}

export async function deleteCustomer(customerid: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const deletedCustomer = await prisma.customer.delete({
      where: { id: customerid, tenantid: tenantId }
    });
    return deletedCustomer;
  } catch (err) {
    throw err;
  }
}

export async function deleteWallet(customerid: string, walletaddress: string) {
  try {
    const prisma = await getPrismaClient();
    const deletedWallet = await prisma.wallet.findMany({
      where: { customerid: customerid, walletaddress: walletaddress }
    });
    await prisma.wallet.deleteMany({
      where: { customerid: customerid, walletaddress: walletaddress }
    });
    return deletedWallet;
  } catch (err) {
    throw err;
  }
}

export async function updateCustomerBonusStatus(customerId: string, status: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedCustomer = await prisma.customer.updateMany({
      where: { id: customerId, tenantid: tenantId },
      data: {
        isbonuscredit: status.toLowerCase() === "true"
      }
    });
    return updatedCustomer;
  } catch (err) {
    throw err;
  }
}

export async function getStakingTransactionByTenantTransactionId(tenantTransactionId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const stakingTransaction = await prisma.staketransaction.findFirst({
      where: {
        tenantid: tenantId,
        tenanttransactionid: tenantTransactionId
      }
    });

    return stakingTransaction ? stakingTransaction : null;
  } catch (err) {
    throw err;
  }
}

export async function decreaseStakeAmount(stakeAccountId: string, amount: number) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.update({
      where: { id: stakeAccountId },
      data: {
        amount: { decrement: amount },
        updatedat: new Date().toISOString()
      }
    });
    return updatedStakeAccount;
  } catch (err) {
    throw err;
  }
}
export async function updateStakeAccountStatus(stakeAccountPublicKey: string, status: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: stakeAccountPublicKey },
      data: {
        status: status,
        updatedat: new Date().toISOString()
      }
    });
    return updatedStakeAccount;
  } catch (err) {
    throw err;
  }
}

export async function updateStakeAccountAmount(stakeAccountId: string, amount: number) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.update({
      where: { id: stakeAccountId },
      data: {
        amount: { increment: amount },
        updatedat: new Date().toISOString()
      }
    });
    return updatedStakeAccount;
  } catch (err) {
    throw err;
  }
}

export async function duplicateStakeAccountWithStatus(
  stakeAccountPubKey: string,
  newStakeAccountPubKey: string,
  newAmount: number,
  newStatus: string
) {
  try {
    const prisma = await getPrismaClient();
    const existingStakeAccount = await prisma.stakeaccount.findFirst({
      where: { stakeaccountpubkey: stakeAccountPubKey }
    });

    if (!existingStakeAccount) {
      throw new Error("Stake account not found");
    }

    const duplicatedStakeAccount = await prisma.stakeaccount.create({
      data: {
        customerid: existingStakeAccount.customerid,
        tokenid: existingStakeAccount.tokenid,
        lockupexpirationtimestamp: existingStakeAccount.lockupexpirationtimestamp,
        tenanttransactionid: existingStakeAccount.tenanttransactionid,
        stakeaccountpubkey: newStakeAccountPubKey,
        network: existingStakeAccount.network,
        status: newStatus,
        error: existingStakeAccount.error,
        tenantuserid: existingStakeAccount.tenantuserid,
        walletaddress: existingStakeAccount.walletaddress,
        validatornodeaddress: existingStakeAccount.validatornodeaddress,
        chaintype: existingStakeAccount.chaintype,
        amount: newAmount,
        symbol: existingStakeAccount.symbol,
        tenantid: existingStakeAccount.tenantid,
        isactive: existingStakeAccount.isactive,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString()
      }
    });

    return duplicatedStakeAccount;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function reduceStakeAccountAmount(stakeAccountPubKey: string, amountToReduce: number) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: stakeAccountPubKey },
      data: {
        amount: { decrement: amountToReduce },
        updatedat: new Date().toISOString()
      }
    });

    return updatedStakeAccount;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function updateStakingTransaction(transactionId: string, status: string, callbackStatus: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedTransaction = await prisma.staketransaction.update({
      where: { id: transactionId },
      data: {
        status: status,
        callbackstatus: callbackStatus,
        updatedat: new Date().toISOString()
      }
    });
    return updatedTransaction;
  } catch (err) {
    throw err;
  }
}

export async function getCustomer(tenantUserId: string, tenantId: string) {
  try {
    console.log("tenantUserId", tenantUserId, tenantId);
    const prisma = await getPrismaClient();
    const customer = await prisma.customer.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenantId
      }
    });
    console.log("customer", customer);
    return customer ? customer : null;
  } catch (err) {
    return null;
  }
}

export async function getCustomerIdByTenant(email: string, tenantId: string) {
  try {
    console.log("email", email, tenantId);
    const prisma = await getPrismaClient();
    const customer = await prisma.customer.findFirst({
      where: {
        emailid: email,
        tenantid: tenantId
      }
    });
    console.log("customer", customer);
    return customer ? customer : null;
  } catch (err) {
    return null;
  }
}

export async function getEmailOtpCustomer(tenantUserId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customer = await prisma.customer.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenantId
      }
    });
    return customer ? customer : null;
  } catch (err) {
    return null;
  }
}

export async function getStakeAccountPubkeys(walletAddress: string, tenantId: string): Promise<string[]> {
  const prisma = await getPrismaClient();
  const stakeAccounts = await prisma.stakeaccount.findMany({
    where: {
      walletaddress: walletAddress,
      tenantid: tenantId,
      status: "OPEN"
      // OR: [
      //   { status: 'OPEN' },
      //   { status: 'MERGED' }
      // ]
    },
    select: {
      stakeaccountpubkey: true
    }
  });

  return stakeAccounts.map((stakeAccount: any) => stakeAccount.stakeaccountpubkey);
}

export async function getCategories() {
  try {
    const prisma = await getPrismaClient();
    const categories = await prisma.productcategory.findMany({
      include: {
        tenant: true
      }
    });
    return categories;
  } catch (err) {
    throw err;
  }
}

export async function getCategoryById(categoryId: string) {
  try {
    const prisma = await getPrismaClient();
    const category = await prisma.productcategory.findUnique({
      where: { id: categoryId }
    });
    return category;
  } catch (err) {
    throw err;
  }
}

export async function getCategoriesByTenantId(tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const category = await prisma.productcategory.findMany({
      where: { tenantid: tenant.id }
    });
    return category;
  } catch (err) {
    throw err;
  }
}

export async function getProducts(value?: string, searchBy?: ProductFindBy, status?: string) {
  try {
    const prisma = await getPrismaClient();

    let whereClause: { isdeleted: boolean; status?: string; id?: string; categoryid?: string; tenantid?: string } = { isdeleted: false };

    if (status === "ACTIVE") {
      whereClause = { ...whereClause, status: ProductStatus.ACTIVE };
    } else if (status === "INACTIVE") {
      whereClause = { ...whereClause, status: ProductStatus.INACTIVE };
    }

    if (searchBy === ProductFindBy.PRODUCT && value) {
      whereClause.id = value;
    } else if (searchBy === ProductFindBy.CATEGORY && value) {
      whereClause.categoryid = value;
    } else if (searchBy === ProductFindBy.TENANT && value) {
      whereClause.tenantid = value;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        category: true,
        productattributes: true
      }
    });
    return products;
  } catch (err) {
    throw err;
  }
}

export async function GetProductAttributesByProductId(productId: string) {
  try {
    const prisma = await getPrismaClient();
    const attributes = await prisma.productattribute.findMany({
      where: { productid: productId }
    });
    return attributes;
  } catch (err) {
    throw err;
  }
}

export async function filterProducts(filters: productfilter[]) {
  const prisma = await getPrismaClient();
  try {
    const whereClause: any = {
      AND: []
    };

    filters.forEach((filter) => {
      const condition: any = {};

      if (filter.key === "rarity") {
        // Check if the value is not one of the allowed product rarities
        const rarityValue = filter.value as productRarity;
        if (!Object.values(productRarity).includes(rarityValue)) {
          throw new Error(`Invalid rarity value: ${filter.value}. Allowed values are ${Object.values(productRarity).join(", ")}.`);
        }
      }

      if (filter.key === "price" || filter.key === "rarity") {
        if (filter.key === "price") {
          const priceValue = typeof filter.value === "string" ? parseFloat(filter.value) : filter.value;
          if (filter.operator === "eq") {
            whereClause.AND.push({
              price: priceValue
            });
          } else {
            condition[filter.operator] = priceValue;
            whereClause.AND.push({
              price: condition
            });
          }
        } else {
          if (filter.operator === "eq") {
            whereClause.AND.push({
              [filter.key]: filter.value
            });
          } else {
            condition[filter.operator] = filter.value;
            whereClause.AND.push({
              [filter.key]: condition
            });
          }
        }
      } else {
        const attrCondition: any = {};

        if (["gte", "gt", "lte", "lt"].includes(filter.operator)) {
          attrCondition[filter.operator] = String(filter.value);
        } else if (filter.operator === "eq") {
          attrCondition.value = filter.value;
        }

        whereClause.AND.push({
          productattributes: {
            some: {
              key: filter.key,
              value: attrCondition.value ? attrCondition.value : attrCondition
            }
          }
        });
      }
    });

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        productattributes: true
      }
    });

    return products;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while removing the product from wishlist.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function addToWishlist(customerId: string, productId: string) {
  const prisma = await getPrismaClient();
  try {
    const existingWishlistItem = await prisma.productwishlist.findFirst({
      where: {
        customerid: customerId,
        productid: productId
      }
    });

    if (existingWishlistItem) {
      throw new Error("Product is already in the wishlist");
    }

    const newWishlistItem = await prisma.productwishlist.create({
      data: {
        customerid: customerId,
        productid: productId
      }
    });

    return newWishlistItem;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the product to the wishlist.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function removeFromWishlist(customerId: string, productId: string) {
  const prisma = await getPrismaClient();
  try {
    const existingWishlistItem = await prisma.productwishlist.findFirst({
      where: {
        customerid: customerId,
        productid: productId
      }
    });

    if (!existingWishlistItem) {
      throw new Error("Product is not in the wishlist");
    }

    await prisma.productwishlist.delete({
      where: {
        id: existingWishlistItem.id
      }
    });

    return existingWishlistItem;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while removing the product from wishlist.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function getWishlistByCustomerId(customerId: string) {
  const prisma = await getPrismaClient();
  try {
    const wishlistItems = await prisma.productwishlist.findMany({
      where: {
        customerid: customerId
      },
      include: {
        product: true
      }
    });

    return wishlistItems;
  } catch (error) {
    throw error;
  }
}

export async function createOrder(order: orders) {
  try {
    const prisma = await getPrismaClient();

    const newOrder = await prisma.orders.create({
      data: {
        sellerid: order.sellerid,
        buyerid: order.buyerid,
        productid: order.productid,
        price: order.price,
        quantity: order.quantity,
        status: orderstatus.CREATED,
        updatedat: new Date().toISOString()
      }
    });

    return newOrder;
  } catch (err) {
    throw err;
  }
}

export async function getOrdersBySeller(sellerId: string) {
  const prisma = await getPrismaClient();
  try {
    const orders = await prisma.orders.findMany({
      where: {
        sellerid: sellerId
      },
      include: {
        buyer: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        product: true
      }
    });
    return orders;
  } catch (err) {
    throw err;
  }
}

export async function getOrdersByBuyer(buyerId: string) {
  const prisma = await getPrismaClient();
  try {
    const orders = await prisma.orders.findMany({
      where: {
        buyerid: buyerId
      },
      include: {
        seller: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        product: true
      }
    });
    return orders;
  } catch (err) {
    throw err;
  }
}

export async function getOrderById(orderId: string) {
  const prisma = await getPrismaClient();
  try {
    const order = await prisma.orders.findUnique({
      where: {
        id: orderId
      },
      include: {
        buyer: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        seller: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        product: true
      }
    });
    return order;
  } catch (err) {
    throw err;
  }
}

export async function getOrdersByTenant(tenantId: string) {
  const prisma = await getPrismaClient();
  try {
    const orders = await prisma.orders.findMany({
      where: {
        product: {
          tenantid: tenantId
        }
      },
      include: {
        buyer: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        seller: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        product: true
      }
    });
    return orders;
  } catch (err) {
    throw err;
  }
}

export async function updateOrderStatus(orderId: string, status: orderstatus) {
  // TODO: add role check
  const prisma = await getPrismaClient();
  try {
    const updatedOrder = await prisma.orders.update({
      where: {
        id: orderId
      },
      data: {
        status: status,
        updatedat: new Date().toISOString()
      },
      select: {
        sellerid: true,
        buyerid: true,
        productid: true,
        status: true,
        updatedat: true
      }
    });

    return {
      message: "Order status updated successfully",
      order: {
        sellerid: updatedOrder.sellerid,
        buyerid: updatedOrder.buyerid,
        productid: updatedOrder.productid,
        status: updatedOrder.status,
        updatedat: updatedOrder.updatedat
      }
    };
  } catch (err) {
    throw err;
  }
}

export async function getOrdersByProductId(productId: string) {
  const prisma = await getPrismaClient();
  try {
    const orders = await prisma.orders.findMany({
      where: {
        productid: productId
      },
      include: {
        buyer: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        seller: {
          select: {
            name: true,
            emailid: true,
            isactive: true,
            iss: true,
            usertype: true
          }
        },
        product: true
      }
    });
    return orders;
  } catch (err) {
    throw err;
  }
}

export async function addReview(productReview: productreview) {
  const prisma = await getPrismaClient();
  try {
    const { customerid, orderid, productid, comment, rating } = productReview;
    const existingReview = await prisma.productreview.findFirst({
      where: {
        customerid,
        productid,
        orderid
      }
    });

    if (existingReview) {
      throw new Error("Already reviewed this product against this order");
    }

    // check if user has bought this product
    const order = await prisma.orders.findFirst({
      where: {
        buyerid: customerid,
        productid
      }
    });

    if (!order) {
      throw new Error("Only buyer can give review to product");
    }

    const newReview = await prisma.productreview.create({
      data: {
        customerid,
        orderid,
        productid,
        comment,
        rating,
        updatedat: new Date().toISOString()
      }
    });

    return newReview;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while giving review to product.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function getReviewsByCustomerId(customerId: string) {
  const prisma = await getPrismaClient();
  try {
    const reviews = await prisma.productreview.findMany({
      where: {
        customerid: customerId
      },
      include: {
        product: true,
        customer: true
      }
    });

    return reviews;
  } catch (error) {
    throw error;
  }
}

export async function getReviewsByProductId(productId: string) {
  const prisma = await getPrismaClient();
  try {
    const reviews = await prisma.productreview.findMany({
      where: {
        productid: productId
      },
      include: {
        product: true,
        customer: true
      }
    });

    return reviews;
  } catch (error) {
    throw error;
  }
}

export async function createCollection(createcollection: createcollection) {
  const prisma = await getPrismaClient();
  const { customerid, description, title } = createcollection;
  try {
    const collection = await prisma.productcollection.findFirst({
      where: {
        customerid,
        title,
        description
      }
    });
    if (collection) {
      throw new Error("Collection is already present");
    }

    const newCollection = await prisma.productcollection.create({
      data: {
        customerid,
        title,
        description,
        updatedat: new Date().toISOString()
      }
    });

    return newCollection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the product to the collection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function addProductToCollection(productcollection: addtocollection) {
  const prisma = await getPrismaClient();
  const { customerid, productid, collectionid } = productcollection;
  try {
    const owned = await prisma.orders.findFirst({
      where: {
        buyerid: customerid,
        productid,
        status: orderstatus.DELIVERED
      }
    });
    if (!owned) {
      throw new Error("This product is not owned by this customer");
    }

    const isCustomerCollection = await prisma.productcollection.findFirst({
      where: {
        customerid,
        id: collectionid
      }
    });

    if (!isCustomerCollection) {
      throw new Error("This collection is not owned by this customer");
    }

    const existingProductInCollection = await prisma.productcollectionproducts.findFirst({
      where: {
        productcollectionid: collectionid,
        productid
      }
    });

    if (existingProductInCollection) {
      throw new Error("This product is already in the collection.");
    }

    await prisma.productcollectionproducts.create({
      data: {
        productcollectionid: collectionid,
        productid
      }
    });

    const updatedCollection = await prisma.productcollection.findFirst({
      where: {
        id: collectionid
      },
      include: {
        products: true
      }
    });

    return updatedCollection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the product to the collection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function removeProductFromCollection(productcollection: addtocollection) {
  const prisma = await getPrismaClient();
  const { customerid, productid, collectionid } = productcollection;

  // Check if the collection is owned by the customer
  const isCustomerCollection = await prisma.productcollection.findFirst({
    where: {
      customerid,
      id: collectionid
    }
  });

  if (!isCustomerCollection) {
    throw new Error("This collection is not owned by this customer");
  }

  try {
    // Check if the product exists in the collection
    const existingProductInCollection = await prisma.productcollectionproducts.findFirst({
      where: {
        AND: [{ productcollectionid: collectionid }, { productid: productid }]
      }
    });

    if (!existingProductInCollection) {
      throw new Error("This product is not in the collection.");
    }

    // Remove the product from the collection
    await prisma.productcollectionproducts.delete({
      where: {
        productcollectionid_productid: {
          productcollectionid: collectionid,
          productid: productid
        }
      }
    });

    const updatedCollection = await prisma.productcollection.findFirst({
      where: {
        id: collectionid
      },
      include: {
        products: true // Include the updated products list
      }
    });

    return updatedCollection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while removing the product from the collection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function getCollectionById(collectionId: string) {
  const prisma = await getPrismaClient();

  try {
    const collection = await prisma.productcollection.findUnique({
      where: {
        id: collectionId
      },
      include: {
        products: true
      }
    });

    if (!collection) {
      throw new Error("Collection not found.");
    }

    return collection;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while retrieving the collection.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function getCollectionByCustomerId(customerId: string) {
  const prisma = await getPrismaClient();

  try {
    const collections = await prisma.productcollection.findMany({
      where: {
        customerid: customerId
      },
      include: {
        products: true
      }
    });

    if (collections.length === 0) {
      throw new Error("No collections found for this customer.");
    }

    return collections;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while retrieving collections.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function transferProductOwnership(
  productId: string,
  sellerId: string,
  buyerId: string,
  fractional: boolean = false,
  fraction: number = 1
) {
  const prisma = await getPrismaClient();
  // Check if the product is already owned by the seller
  const sellerOwnership = await prisma.productownership.findFirst({
    where: {
      productId: productId,
      customerId: sellerId,
      fractional: fractional
    }
  });

  if (!sellerOwnership) {
    throw new Error("Seller does not own this product.");
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (fractional && fraction < 1) {
        // Fractional ownership transfer
        const remainingFraction = sellerOwnership.fraction! - fraction;

        if (remainingFraction > 0) {
          // Update seller's ownership fraction
          await tx.productownership.update({
            where: { id: sellerOwnership.id },
            data: { fraction: remainingFraction }
          });

          // Create new ownership record for buyer
          await tx.productownership.create({
            data: {
              customerId: buyerId,
              productId: productId,
              fractional: true,
              fraction: fraction
            }
          });
        } else if (remainingFraction === 0) {
          // If transferring full ownership, remove seller's record
          await tx.productownership.delete({
            where: { id: sellerOwnership.id }
          });

          // Create new ownership record for buyer
          await tx.productownership.create({
            data: {
              customerId: buyerId,
              productId: productId,
              fractional: true,
              fraction: fraction
            }
          });
        } else {
          throw new Error("Fraction transfer exceeds seller ownership.");
        }
      } else {
        // Full ownership transfer
        await tx.productownership.delete({
          where: { id: sellerOwnership.id }
        });

        await tx.productownership.create({
          data: {
            customerId: buyerId,
            productId: productId,
            fractional: false,
            fraction: null
          }
        });
      }
    });

    return {
      message: "Ownership transferred successfully",
      productId,
      sellerId,
      buyerId,
      fractional,
      fraction
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while transferring ownership.");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function searchProductsByName(name?: string) {
  try {
    const prisma = await getPrismaClient();

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive"
        }
      },
      include: {
        category: true,
        productattributes: true
      }
    });

    return products;
  } catch (err) {
    throw err;
  }
}
