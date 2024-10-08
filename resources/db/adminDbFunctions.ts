import {
  AuthType,
  CallbackStatus,
  customer,
  StakeAccountStatus,
  tenant,
  updatecustomer,
  product,
  productattribute,
  productcategory,
  productfilter,
  updateproductattribute,
  productstatus,
  RefType
} from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { logWithTrace } from "../utils/utils";
import { getPrismaClient } from "./dbFunctions";


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
        cubistuserid: customer.cubistuserid?.toString(),
        isbonuscredit: customer.isBonusCredit,
        isactive: customer.isactive,
        createdat: new Date().toISOString()
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

export async function createAdminWallet(org: cs.Org, cubistUserId: string, chainType: string, tenantId: string, customerId?: string) {
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
          tenantid: tenantId
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

export async function insertAdminTransaction(
  senderWalletAddress: string,
  receiverWalletaddress: string,
  amount: number,
  chainType: string,
  symbol: string,
  txhash: string,
  tenantId: string,
  adminUserId: string,
  tokenId: string,
  network: string,
  status: string,
  tenantTransactionId: string,
  error?: string
) {
  try {
    const prisma = await getPrismaClient();
    const newTransaction = await prisma.admintransaction.create({
      data: {
        adminuserid: adminUserId,
        callbackstatus: CallbackStatus.PENDING,
        tokenid: tokenId,
        tenanttransactionid: tenantTransactionId,
        network: network,
        status: status,
        error: error as string,
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

export async function getAdminTransactionByTenantTransactionId(tenantTransactionId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const transaction = await prisma.admintransaction.findFirst({
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

export async function getAdminWalletAndTokenByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const wallet = await prisma.adminwallet.findFirst({
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
      const wallet = await prisma.adminwallet.findFirst({
        where: { chaintype: t.chaintype, walletaddress: walletAddress }
      });
      return { ...t, ...wallet, tokenname: t.name, tokenid: t.id };
    });
    return await Promise.all(walletsWithChainTypePromises);
  } catch (err) {
    throw err;
  }
}

export async function getAdminTransactionsByWalletAddress(
  walletAddress: string,
  tenant: tenant,
  limit: number,
  pageNo: number,
  symbol: string
) {
  try {
    const prisma = await getPrismaClient();
    const transactionCount = await prisma.admintransaction.count({
      where: {
        walletaddress: walletAddress,
        tenantid: tenant.id
      }
    });
    if (transactionCount == 0) {
      return [];
    }
    const transactions = await prisma.admintransaction.findMany({
      where: {
        walletaddress: walletAddress,
        tenantid: tenant.id
      },
      take: limit,
      skip: (pageNo - 1) * limit
    });
    const token = await prisma.token.findFirst({
      where: {
        symbol: symbol
      }
    });
    const list = transactions.map((t: any) => {
      return { ...t, ...(token || {}) };
    });
    const data = {
      total: transactionCount,
      totalPages: Math.ceil(transactionCount / limit),
      transactions: list
    };
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getAdminUsers(tenant: tenant, limit: number, pageNo: number) {
  try {
    const prisma = await getPrismaClient();
    const userCount = await prisma.adminuser.count({
      where: {
        tenantid: tenant.id
      }
    });
    if (userCount == 0) {
      return [];
    }
    const users = await prisma.adminuser.findMany({
      where: {
        tenantid: tenant.id
      },
      take: limit,
      skip: (pageNo - 1) * limit
    });

    const data = {
      total: userCount,
      totalPages: Math.ceil(userCount / limit),
      users: users
    };
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getAdminTransactionsById(tenantTransactionId: string, tenant: tenant, symbol: string) {
  try {
    const prisma = await getPrismaClient();
    const transactions = await prisma.admintransaction.findMany({
      where: {
        tenanttransactionid: tenantTransactionId,
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

export async function getAllAdminTransactions(chainType: string) {
  try {
    const prisma = await getPrismaClient();
    const stakingTransactions = await prisma.admintransaction.findMany({
      where: {
        status: "PENDING",
        chaintype: chainType
      }
    });
    return stakingTransactions;
  } catch (err) {
    throw err;
  }
}

export async function updateAdminTransaction(transactionId: string, status: string, callbackStatus: string) {
  try {
    const prisma = await getPrismaClient();
    const updatedTransaction = await prisma.admintransaction.update({
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

export async function getAdminUserByTenant(email: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customer = await prisma.adminuser.findFirst({
      where: {
        emailid: email,
        tenantid: tenantId
      }
    });
    return customer ? customer : null;
  } catch (err) {
    return null;
  }
}

export async function getAdminUserByEmail(emailId: string, tenantId: string) {
  try {
    const prisma = await getPrismaClient();
    const customer = await prisma.adminuser.findFirst({
      where: {
        emailid: emailId,
        tenantid: tenantId
      }
    });
    return customer ? customer : null;
  } catch (err) {
    return null;
  }
}

export async function updateAdminCubistData(customer: updatecustomer) {
  try {
    const prisma = await getPrismaClient();
    const newCustomer = await prisma.adminuser.update({
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

export async function createCategory(category: productcategory) {
  try {
    const prisma = await getPrismaClient();
    const existingCategory = await prisma.productcategory.findFirst({
      where: {
        name: category.name,
        tenantid: category.tenantid
      }
    });
    if (existingCategory) {
      throw new Error("Category is already added against this tenant with this name");
    }
    const newCategory = await prisma.productcategory.create({
      data: {
        name: category.name,
        tenantid: category.tenantid
      }
    });

    return newCategory;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the category");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function createProduct(product: product) {
  try {
    if (product.purchasedpercentage > 100) {
      throw new Error("purchasedpercentage cannot exceed 100.");
    }
    const prisma = await getPrismaClient();
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: product.name,
        categoryid: product.categoryid
      }
    });

    if (existingProduct) {
      throw new Error("Product is already added against this category with this name");
    }
    const newProduct = await prisma.product.create({
      data: {
        name: product.name,
        categoryid: product.categoryid,
        rarity: product.rarity,
        price: product.price,
        purchasedpercentage: product.purchasedpercentage,
        availablepercentage: 100 - product.purchasedpercentage
      }
    });
    return newProduct;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the product");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function createProductAttribute(productattributes: productattribute) {
  try {
    const prisma = await getPrismaClient();
    const newAttribute = await prisma.productattribute.create({
      data: {
        key: productattributes.key,
        value: productattributes.value,
        type: productattributes.type,
        productid: productattributes.productid
      }
    });
    return newAttribute;
  } catch (err) {
    throw err;
  }
}

export async function updateCategory(categoryId: string, category: string) {
  try {
    const prisma = await getPrismaClient();
    const updated = await prisma.productcategory.update({
      where: {
        id: categoryId
      },
      data: {
        name: category,
        updatedat: new Date().toISOString()
      }
    });

    return updated;
  } catch (err) {
    throw err;
  }
}

export async function updateProduct(id: string, product: Partial<product>) {
  try {
    const prisma = await getPrismaClient();

    const updatedProduct = await prisma.product.update({
      where: {
        id: id
      },
      data: product
    });

    return updatedProduct;
  } catch (err) {
    throw err;
  }
}

export async function updateProductAttribute(updateproductattribute: updateproductattribute) {
  try {
    const prisma = await getPrismaClient();
    const { productId, key, newValue } = updateproductattribute;
    const updatedAttribute = await prisma.productattribute.updateMany({
      where: {
        productid: productId,
        key: key
      },
      data: {
        value: newValue,
        updatedat: new Date().toISOString()
      }
    });

    if (updatedAttribute.count === 0) {
      throw new Error("Attribute not found.");
    }
    const fetchedAttribute = await prisma.productattribute.findFirst({
      where: {
        productid: productId,
        key: key
      }
    });

    if (fetchedAttribute) {
      return fetchedAttribute;
    } else {
      throw new Error("Updated attribute could not be found.");
    }
  } catch (err) {
    console.error("Error in updateProductAttribute:", err);
    throw err;
  }
}
export async function updateProductStatus(productId: string, status:productstatus) {
  try {
    const prisma = await getPrismaClient();

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: status,
        updatedat: new Date().toISOString()
      }
    });

    return updatedProduct;
  } catch (err) {
    throw err;
  }
}

export async function deleteProduct(productId: string) {
  try {
    const prisma = await getPrismaClient();

    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isdeleted:true },
    });

    return deletedProduct;
  } catch (err) {
    throw err;
  }
}

export async function addReferenceToDb(tenantId: string,file : any,refType: string,websiteName?: string,websiteUrl?: string) {
  try {
    const prisma = await getPrismaClient();
    const newRef = await prisma.knowledgebasereference.create({
      data: {
        tenantid: tenantId as string,
        reftype: refType,
        name:refType == RefType.DOCUMENT ? file.fileName : websiteName,
        url:refType == RefType.DOCUMENT ? file.fileName : websiteUrl,
        isactive: true,
        createdat: new Date().toISOString()
      }
    });
    return newRef;
  } catch (err) {
    throw err;
  }
}

export async function getReferenceList(
  tenant: tenant,
  limit: number,
  pageNo: number
) {
  try {
    const prisma = await getPrismaClient();
    const refCount = await prisma.knowledgebasereference.count({
      where: {
        tenantid: tenant.id
      }
    });
    if (refCount == 0) {
      return [];
    }
    const refs = await prisma.knowledgebasereference.findMany({
      where: {
        tenantid: tenant.id
      },
      take: limit,
      skip: (pageNo - 1) * limit
    });

    const data = {
      total: refCount,
      totalPages: Math.ceil(refCount / limit),
      refs: refs
    };
   
    return data;
  } catch (err) {
    throw err;
  }
}

