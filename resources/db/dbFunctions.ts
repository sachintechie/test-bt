import { PrismaClient } from "@prisma/client";
import { CallbackStatus, customer, StakeAccountStatus, tenant } from "./models";
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
    datasourceUrl: databaseUrl
  });
  return prismaClient;
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
        cubistuserid: customer.cubistuserid.toString(),
        isbonuscredit: customer.isBonusCredit,
        isactive: customer.isactive,
        createdat: new Date().toISOString(),
      }
    });
    return newCustomer;
  } catch (err) {
    throw err;
  }
}

export async function createAdminUser(customer: customer) {
  try {
    const prisma = await getPrismaClient();
    const newCustomer = await prisma.adminuser.create({
      data: {
        tenantuserid: customer.tenantuserid,
        tenantid: customer.tenantid as string,
        emailid: customer.emailid,
        name: customer.name,
        iss: customer.iss,
        cubistuserid: customer.cubistuserid.toString(),
        isbonuscredit: customer.isBonusCredit,
        isactive: customer.isactive,
        createdat: new Date().toISOString(),
      }
    });
    return newCustomer;
  } catch (err) {
    throw err;
  }
}

export async function createWalletAndKey(org: any, cubistUserId: string, chainType: string, customerId?: string, key?: any) {
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

export async function createAdminWallet(org: cs.Org, cubistUserId: string, chainType: string, tenantId: string,customerId?: string) {
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
      const newWallet = await prisma.adminwallet.create({
        data: {
          adminuserid: customerId as string,
          walletaddress: key.materialId,
          walletid: key.id,
          chaintype: chainType,
          wallettype: keyType.toString(),
          isactive: true,
          createdat: new Date().toISOString(),
          tenantid:tenantId
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
  lockupExpirationTimestamp: number,
  error?: string
) {
  try {
    const prisma = await getPrismaClient();
    const newStakeaccount = await prisma.stakeaccount.create({
      data: {
        customerid: customerId,
        walletaddress: senderWalletAddress,
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
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        error: error
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

export async function mergeDbStakeAccounts(sourceStakeAccountPubkey: string, targetStakeAccountPubkey: string) {
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

    const newAmount = sourceAccount.amount || 0 + Number(targetAccount.amount || 0);

    const updatedTargetAccount = await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: targetStakeAccountPubkey },
      data: { amount: newAmount }
    });

    const removedSourceAccount = await prisma.stakeaccount.deleteMany({
      where: { stakeaccountpubkey: sourceStakeAccountPubkey }
    });

    return { updatedTargetAccount, removedSourceAccount };
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
  sourceStakeAccountPubkey: string,
  targetStakeAccountPubkey: string,
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

    const newAmount = sourceAccount.amount || 0 + Number(targetAccount.amount || 0);

    await prisma.stakeaccount.updateMany({
      where: { stakeaccountpubkey: sourceStakeAccountPubkey },
      data: { amount: newAmount, updatedat: new Date().toISOString() }
    });

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
        tokenid: sourceStakeTransaction!.tokenid,
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

    await prisma.staketransaction.create({
      data: {
        customerid: stakeAccount.customerid,
        type: "withdraw",
        tokenid: sourceStakeTransaction!.tokenid,
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
  } catch (err) {
    console.error(err);
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

export async function getAdminWalletByAdmin(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.adminuser.findFirst({
      where: {
        tenantuserid: tenantUserId,
        tenantid: tenant.id
      },
      include: {
        adminwallets: {
          where: {
            chaintype: chaintype
          }
        }
      }
    });
    if (wallet?.adminwallets.length == 0 || wallet == null) return null;
    const newWallet = {
      walletaddress: wallet?.adminwallets[0].walletaddress,
      createdat: wallet?.adminwallets[0].createdat,
      chaintype: wallet?.adminwallets[0].chaintype,
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
   
    const chainType = await prisma.chaintype.findMany({
    });
    var newWallet=[] ;
    for (const chain of chainType){
    //  chainType.forEach((chain: any) => {
      const wallet = await prisma.wallet.findFirst({
        where: { customerid: customerid,chaintype:chain?.chain }
      });
      console.log(wallet);

      const walletData = {
        chaintype: chain?.chain,
        walletaddress: wallet?.walletaddress,
        wallettype: wallet?.wallettype,
        symbol : chain?.symbol,
        createdat: wallet?.createdat,
        customerid: wallet?.customerid
      }
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
export async function updateStakeAccountStatus(stakeAccountId: string, status: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.update({
      where: { id: stakeAccountId },
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
export async function updateStakeAccount(stakeAccountId: string, status: string, amount: number) {
  try {
    const prisma = await getPrismaClient();
    const updatedStakeAccount = await prisma.stakeaccount.update({
      where: { id: stakeAccountId },
      data: {
        status: status,
        amount: { decrement: amount },
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

export async function duplicateStakeAccount(stakeAccountPubKey: string, newStakeAccountPubKey: string, newAmount: number) {
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
        lockupexpirationtimestamp: existingStakeAccount.lockupexpirationtimestamp,
        tenanttransactionid: existingStakeAccount.tenanttransactionid,
        stakeaccountpubkey: newStakeAccountPubKey,
        network: existingStakeAccount.network,
        status: existingStakeAccount.status,
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

export async function getAdminUser(tenantUserId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customer = await prisma.adminuser.findFirst({
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
      tenantid: tenantId
    },
    select: {
      stakeaccountpubkey: true
    }
  });

  return stakeAccounts.map((stakeAccount: any) => stakeAccount.stakeaccountpubkey);
}
