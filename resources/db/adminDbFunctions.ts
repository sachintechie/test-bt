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
  ProductStatus,
  RefType,
  productinventory,
  inventoryfilter,
} from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { logWithTrace } from "../utils/utils";
import { getPrismaClient } from "./dbFunctions";
import { ProjectStage, ProjectStatusEnum, ProjectType, ReferenceStage } from "@prisma/client";

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

export async function createProject(tenant: tenant, name: string, description: string, projectType: ProjectType,
  organizationId: string, knowledgeBaseId: string) {
  console.log("Creating admin project", tenant.id, projectType);
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.project.create({
      data: {
        name: name,
        description: description,
        knowledgebaseid: knowledgeBaseId,
        projecttype: projectType,
        organizationid: organizationId,
        tenantid: tenant.id,
        isactive: true,
        projectstage: ProjectStage.DATA_SELECTION,
        projectstatus: ProjectStatusEnum.ACTIVE,
        createdat: new Date().toISOString(),
        createdby: tenant.adminuserid ?? ""
      }
    });
    return newProject;
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
        description: product.description,
        type: product.type,
        sku: product.sku,
        categoryid: product.categoryid,
        tenantid: product.tenantid,
        rarity: product.rarity,
        price: product.price,
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
export async function updateProductStatus(productId: string, status: ProductStatus) {
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
      data: { isdeleted: true }
    });

    return deletedProduct;
  } catch (err) {
    throw err;
  }
}

export async function addReferenceToDb(tenantId: string, file: any, refType: string, isIngested: boolean, projectId: string, websiteName?: string, websiteUrl?: string,
  depth?: number, datasource_id?: string, data?: any, ingestionJobId?: string, hashedData?: any
) {
  try {
    const prisma = await getPrismaClient();
    const existingReference = await prisma.reference.findFirst({
      where: {
        name: refType == RefType.DOCUMENT ? file.fileName : websiteName,
        url: refType == RefType.DOCUMENT ? data.url : websiteUrl,
        isdeleted: false
      }
    });
    if (existingReference) {
      return {
        data: null,
        error: "Reference is already added with this name"
      }
    }
    const newRef = await prisma.reference.create({
      data: {
        tenantid: tenantId as string,
        projectid: projectId,
        referencestage: ReferenceStage.DATA_STORAGE,
        reftype: refType,
        name: refType == RefType.DOCUMENT ? file.fileName : websiteName,
        url: refType == RefType.DOCUMENT ? data.url : websiteUrl,
        size: refType == RefType.DOCUMENT ? data.size : null,
        ingested: isIngested,
        isdeleted: false,
        s3prestorehash: hashedData.s3PreStoreHash,
        s3prestoretxhash: hashedData.s3PreStoreTxHash,
        s3poststorehash: hashedData.s3PostStoreHash,
        s3poststoretxhash: hashedData.s3PostStoreTxHash,
        chaintype: hashedData.chainType,
        chainid: hashedData.chainId.toString(),
        datasourceid: datasource_id,
        ingestionjobid: ingestionJobId,
        depth: depth,
        isactive: true,
        createdat: new Date().toISOString()
      }
    });
    return {
      data: newRef,
      error: null
    }
  } catch (err) {
    return {
      data: null,
      error: err
    }
  }
}

export async function isDocumentReferenceExist(file: any, data?: any) {
  const prisma = await getPrismaClient();
  const existingReference = await prisma.reference.findFirst({
    where: {
      name: file.fileName,
      url: data.url,
      isdeleted: false
    }
  });
  if (existingReference) {
    return {
      isExist: true,
      error: "Reference is already added with this name"
    }
  } else {
    return {
      isExist: false,
      error: null
    }
  }
}

export async function isWebsiteReferenceExist(websiteName: string, websiteUrl: string) {
  const prisma = await getPrismaClient();
  const existingReference = await prisma.reference.findFirst({
    where: {
      name: websiteName,
      url: websiteUrl,
      isdeleted: false
    }
  });
  if (existingReference) {
    return {
      isExist: true,
      error: "Reference is already added with this name"
    }
  } else {
    return {
      isExist: false,
      error: null
    }
  }
}

export async function isProjectExist(projectType: ProjectType, name: string, organizationId: string) {
  const prisma = await getPrismaClient();
  const existingProject = await prisma.project.findFirst({
    where: {
      name: name,
      projecttype: projectType,
      organizationid: organizationId,
    }
  });
  if (existingProject) {
    return {
      isExist: true,
      error: "Project is already added with this name"
    }
  } else {
    return {
      isExist: false,
      error: null
    }
  }
}




export async function getDataSourcesCount(tenantId: string, refType: string) {

  try {
    const prisma = await getPrismaClient();

    const result = await prisma.reference.groupBy({
      by: ['datasourceid'],  // Group by the `datasourceId` field
      _count: {
        id: true,  // Count the number of rows (assuming `id` is a unique identifier)
      },
      where: {
        isdeleted: false,
        tenantid: tenantId,
        reftype: refType
      }
    });
    // Step 2: Filter the results where the count is less than 10
    const filteredResults = result.filter((group) => group._count.id < 10);

    // Step 3: Return only the first matched datasourceId
    if (filteredResults.length > 0) {
      return filteredResults[0].datasourceid;  // Return the first result
    } else {
      return null;  // Return null if no datasourceId has a count less than 10
    }
  } catch (error) {
    console.error('Error fetching datasource counts:', error);
    throw error;
  }
}




export async function getReferenceById(tenantId: string, refId: string) {
  try {
    const prisma = await getPrismaClient();
    const reference = await prisma.reference.findFirst({
      where: {
        id: refId,
        tenantid: tenantId,
        isdeleted: false
      }
    });
    if (reference == null) {
      throw new Error("Reference not found");
    }
    return reference;
  } catch (err) {
    throw err;
  }
}

export async function deleteRef(tenantId: string, refId: string) {
  try {
    const prisma = await getPrismaClient();
    const reference = await prisma.reference.findFirst({
      where: {
        id: refId,
        tenantid: tenantId,
        isdeleted: false
      }
    });
    if (reference == null) {
      throw new Error("Reference not found");
    }
    const deletedReference = await prisma.reference.update({
      where: { id: refId },
      data: { isdeleted: true }
    });
    return deletedReference;
  } catch (err) {
    throw err;
  }
}



export async function getReferenceList(
  limit: number,
  pageNo: number,
  tenantId: string,
  refType: string,
  projectId: string
) {
  try {
    const prisma = await getPrismaClient();
    const refCount = await prisma.reference.count({
      where: {
        tenantid: tenantId,
        reftype: refType,
        isdeleted: false,
        projectid: projectId
      },
      orderBy: {
        createdat: "desc"
      }
    });
    if (refCount == 0) {
      return [];
    }
    const refs = await prisma.reference.findMany({
      where: {
        tenantid: tenantId,
        reftype: refType,
        isdeleted: false,
        projectid: projectId

      },

      orderBy: {
        createdat: "desc"
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

export async function getProjectList(
  limit: number,
  pageNo: number,
  organizationId: string
) {
  try {
    const prisma = await getPrismaClient();
    const projectCount = await prisma.project.count({
      where: {
        organizationid: organizationId
      },
      orderBy: {
        createdat: "desc"
      }
    });
    if (projectCount == 0) {
      return [];
    }
    const projects = await prisma.project.findMany({
      where: {
        organizationid: organizationId
      },

      orderBy: {
        createdat: "desc"
      },
      take: limit,
      skip: (pageNo - 1) * limit
    });

    const data = {
      total: projectCount,
      totalPages: Math.ceil(projectCount / limit),
      projects: projects
    };

    return data;
  } catch (err) {
    throw err;
  }
}

export async function getAdminProductsByTenantId(offset: number, limit: number, tenantId: string) {
  try {
    const prisma = await getPrismaClient();

    const products = await prisma.product.findMany({
      where: {
        tenantid: tenantId
      },
      skip: offset,
      take: limit
    });

    const totalCount = await prisma.product.count({
      where: {
        tenantid: tenantId
      }
    });

    return { products, totalCount };
  } catch (err) {
    throw err;
  }
}

export async function createInventory(inventoryData: productinventory) {
  try {
    const prisma = await getPrismaClient();

    const newInventory = await prisma.productinventory.create({
      data: {
        inventoryid: inventoryData.inventoryid,
        productid: inventoryData.productid,
        inventorycategory: inventoryData.inventorycategory,
        price: inventoryData.price,
        quantity: inventoryData.quantity,
        ownershipnft: inventoryData.ownershipnft ?? false,
        smartcontractaddress: inventoryData.smartcontractaddress,
        tokenid: inventoryData.tokenid,
        isdeleted: false
      }
    });

    return newInventory;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}




export async function getInventoriesByProductId(offset: number, limit: number, tenantId: string, productId: string) {
  try {
    const prisma = await getPrismaClient();


    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new Error("Product not found.");
    }

    if (product.tenantid !== tenantId) {
      throw new Error("Unauthorized: Tenant does not own the product.");
    }


    const inventory = await prisma.productinventory.findMany({
      where: {
        productid: productId,
        isdeleted: false
      },
      skip: offset,
      take: limit,
    });


    const totalCount = await prisma.productinventory.count({
      where: {
        productid: productId,
        isdeleted: false
      },
    });


    return { inventory, totalCount };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function updateInventory(inventoryId: string, updateData: productinventory) {
  const prisma = await getPrismaClient();

  try {
    const updatedInventory = await prisma.productinventory.update({
      where: {
        id: inventoryId,

      },
      data: updateData,
    });

    return updatedInventory;
  } catch (error) {
    console.error("Error in updateInventory:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function createBulkInventory(inventoryDataArray: productinventory[]) {
  try {
    const prisma = await getPrismaClient();

    // Perform bulk creation using createMany
    const createdInventories = await prisma.productinventory.createMany({
      data: inventoryDataArray.map(inventoryData => ({
        inventoryid: inventoryData.inventoryid,
        productid: inventoryData.productid,
        inventorycategory: inventoryData.inventorycategory,
        price: inventoryData.price,
        quantity: inventoryData.quantity,
        ownershipnft: inventoryData.ownershipnft ?? false,
        smartcontractaddress: inventoryData.smartcontractaddress,
        tokenid: inventoryData.tokenid,
        isdeleted: false
      })),
      skipDuplicates: true
    });

    return createdInventories;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function createBulkProduct(productDataArray: product[]) {
  try {
    const prisma = await getPrismaClient();

    const createdProduct = await prisma.product.createMany({
      data: productDataArray.map(productData => ({
        name: productData.name,
        description: productData.description,
        type: productData.type,
        sku: productData.sku,
        rarity: productData.rarity,
        price: productData.price,
        categoryid: productData.categoryid,
        tenantid: productData.tenantid,
        purchasedpercentage: 0,
        availablepercentage: 100
      })),
      skipDuplicates: true
    });

    return createdProduct;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the product");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function deleteInventory(inventoryId: string) {
  try {
    const prisma = await getPrismaClient();

    const deletedInventory = await prisma.productinventory.update({
      where: { id: inventoryId },
      data: { isdeleted: true }
    });

    return deletedInventory;
  } catch (err) {
    throw err;
  }
}

export async function searchInventory(searchKeyword: string) {
  try {
    const prisma = await getPrismaClient();

    if (!searchKeyword || searchKeyword.trim() === "") {
      return {
        status: 400,
        data: null,
        error: "Search keyword is required."
      };
    }

    const searchResult = await prisma.productinventory.findMany({
      where: {
        isdeleted: false,
        OR: [
          { inventoryid: { contains: searchKeyword.trim(), mode: 'insensitive' } },
          { product: { name: { contains: searchKeyword.trim(), mode: 'insensitive' } } }
        ]
      },
      include: {
        product: true
      }
    });

    return searchResult
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message || "An error occurred while searching the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}



export async function filterInventory(filters: inventoryfilter) {
  try {
    const prisma = await getPrismaClient();

    const whereClause: any = {
      isdeleted: false,
    };

    if (filters.inventoryid) {
      whereClause.inventoryid = {
        contains: filters.inventoryid,
        mode: 'insensitive'
      };
    }

    if (filters.productname) {
      whereClause.product = {
        name: {
          contains: filters.productname,
          mode: 'insensitive'
        }
      };
    }

    if (filters.price) {
      const { operator, value } = filters.price;
      if (operator === 'lt') {
        whereClause.price = { lt: value };
      } else if (operator === 'gt') {
        whereClause.price = { gt: value };
      } else if (operator === 'eq') {
        whereClause.price = value;
      } else if (operator === 'gte') {
        whereClause.price = { gte: value };
      } else if (operator === 'lte') {
        whereClause.price = { lte: value };
      }
    }

    if (filters.quantity) {
      const { operator, value } = filters.quantity;
      if (operator === 'lt') {
        whereClause.quantity = { lt: value };
      } else if (operator === 'gt') {
        whereClause.quantity = { gt: value };
      } else if (operator === 'eq') {
        whereClause.quantity = value;
      } else if (operator === 'gte') {
        whereClause.quantity = { gte: value };
      } else if (operator === 'lte') {
        whereClause.quantity = { lte: value };
      }
    }

    const filteredResult = await prisma.productinventory.findMany({
      where: whereClause,
      include: {
        product: true
      }
    });

    return filteredResult;
  } catch (err) {
    throw err;
  }
}

export async function getProductById(productId: string) {
  try {
    const prisma = await getPrismaClient();
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    return product;
  } catch (error: any) {
    throw new Error(`Error retrieving product with ID ${productId}: ${error.message}`);
  }
}

export async function insertMediaEntries(mediaData: any[]) {
  try {
    const prisma = await getPrismaClient();
    const newMediaEntries = await prisma.media.createMany({
      data: mediaData,
    });
    return newMediaEntries;
  } catch (error: any) {
    throw new Error(`Error inserting media entries: ${error.message}`);
  }
}

export async function deleteMediaEntries(mediaUrls: string[], productId: string) {
  try {
    const prisma = await getPrismaClient();
    await prisma.media.deleteMany({
      where: {
        entityid: productId,
        url: { in: mediaUrls }
      }
    });
  } catch (error: any) {
    throw new Error(`Error deleting media entries: ${error.message}`);
  }
}

export async function addOwnership(productId: string, customerId: string) {
  try {
    const prisma = await getPrismaClient();
    await prisma.productownership.create({
      data: {
        productid: productId,
        customerid: customerId,
        fractional: false,
        fraction: 0
      }
    });
  } catch (error: any) {
    throw new Error(`Error adding ownership: ${error.message}`);
  }
}

export async function getAdminUserById(userId: string) {
  try {
    const prisma = await getPrismaClient();
    const adminUser = await prisma.adminuser.findUnique({
      where: { id: userId }
    });
    return adminUser;
  } catch (error: any) {
    throw new Error(`Error retrieving admin user with ID ${userId}: ${error.message}`);
  }
}