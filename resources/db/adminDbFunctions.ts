import {
  CallbackStatus,
  customer,
  tenant,
  updatecustomer,
  product,
  productattribute,
  productcategory,
  ProductStatus,
  RefType,
  productinventory,
  inventoryfilter,
  productsensorydata,
  activitylogs
} from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";
import { logWithTrace, getKeyTypeBasedOnChainId, deriveDisplayAddressForCustomChains } from "../utils/utils";
import { getPrismaClient } from "./dbFunctions";
import { ActionStatus, ProjectStage, ProjectStatusEnum, ProjectType, ReferenceStage, ReferenceStatus } from "@prisma/client";

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

export async function getFirstReferenceByProjectId(projectId: string) {
  try {
    const prisma = await getPrismaClient();
    const reference = await prisma.reference.findFirst({
      where: {
        projectid: projectId,
        isdeleted: false
      }
    });
    return reference;
  } catch (err) {
    throw err;
  }
}

export async function updateProjectStage(projectId: string, stage: ProjectStage, status: ProjectStatusEnum) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        projectstage: stage,
        projectstatus: status
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}

export async function updateProjectKbAndIndex(projectId: string, kbId : string, indexId : string) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        knowledgebaseid: kbId,
        indexid: indexId
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}
export async function updateProjectKbBucket(projectId: string,kbId:string,indexId:string,bucketName : string) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        s3bucketname: bucketName,
        s3bucketregion: "us-east-1",
        knowledgebaseid: kbId,
        indexid: indexId
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}

export async function updateProjectBucket(projectId: string,bucketName : string) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        s3bucketname: bucketName,
        s3bucketregion: "us-east-1",
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}

export async function updateReferenceStage(projectId: string, refIds: string[], referenceStage: ReferenceStage,status : ReferenceStatus) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.reference.updateMany({
      where: { id: {in:refIds} },
      data: {
        referencestage: referenceStage,
        status: status
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}

export async function updateReferenceStageById(projectId: string, refId: string, referenceStage: ReferenceStage,status : ReferenceStatus) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.reference.update({
      where: { id: refId},
      data: {
        referencestage: referenceStage,
        status: status
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}

export async function updateReferenceStatus( files : any) {
  try {
    const updatedRefs = [];
    const prisma = await getPrismaClient();
    for (const file of files) {
      const updatedRef = await prisma.reference.update({
        where: { id: file.id },
        data: {
          status: file.status
        }
      });
      updatedRefs.push(updatedRef);
    }
  
    return updatedRefs;
  } catch (err) {
    throw err;
  }
}

export async function updateReferenceStatusByAdmin( files : any) {
  try {
    const updatedRefs = [];
    const prisma = await getPrismaClient();
    for (const file of files) {
      const updatedRef = await prisma.reference.update({
        where: { id: file.id },
        data: {
          status: file.status == ReferenceStatus.UPLOADED ? ReferenceStatus.APPROVED : file.status
        }
      });
      updatedRefs.push(updatedRef);
    }
  
    return updatedRefs;
  } catch (err) {
    throw err;
  }
}

export async function updateRefStatus(refId: string,status : ReferenceStatus) {
  try {
    const prisma = await getPrismaClient();
    const updatedProject = await prisma.reference.update({
      where: { id: refId },
      data: {
        status: status
      }
    });
    return updatedProject;
  } catch (err) {
    throw err;
  }
}


export async function updateRefererncePostS3Data(refId: string, ingested: boolean, hashedData: any) {
  try {
    const prisma = await getPrismaClient();
    const updatedReference = await prisma.reference.update({
      where: { id: refId },
      data: {
        ingested: ingested,
        referencestage: ReferenceStage.DATA_SOURCE
      }
    });
    return updatedReference;
  } catch (err) {
    throw err;
  }
}

export async function updateRefererncePostIndexing(refId: string, ingested: boolean, hashedData: any) {
  try {
    const prisma = await getPrismaClient();
    const updatedReference = await prisma.reference.update({
      where: { id: refId },
      data: {
        ingested: ingested,
        referencestage: ReferenceStage.PUBLISHED
      }
    });
    return updatedReference;
  } catch (err) {
    throw err;
  }
}
export async function updateReferernces(projectId: string, ingested: boolean, refStage?: ReferenceStage) {
  try {
    const prisma = await getPrismaClient();
    const updatedReference = await prisma.reference.updateMany({
      where: { projectid: projectId },
      data: {
        ingested: ingested,
        referencestage: refStage
      }
    });
    return updatedReference;
  } catch (err) {
    throw err;
  }
}

export async function createProject(
  tenant: tenant,
  name: string,
  description: string,
  projectType: ProjectType,
  chainType: string,
  organizationId: string
) {
  console.log("Creating admin project", tenant.id, projectType);
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.project.create({
      data: {
        name: name,
        description: description,
        projecttype: projectType,
        organizationid: organizationId,
        tenantid: tenant.id,
        chaintype: chainType,
        isactive: true,
        projectstage: ProjectStage.DATA_SOURCE,
        projectstatus: ProjectStatusEnum.STARTED,
        createdat: new Date().toISOString(),
        createdby: tenant.adminuserid ?? ""
      }
    });
    return newProject;
  } catch (err) {
    throw err;
  }
}

export async function   createStage(
  tenantUserId: string,
  name: string,
  description: string,
  stageTypeId: string,
  projectId: string,
  stageSequence: number
) {
  console.log("Creating admin stage");
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.stage.create({
      data: {
        name: name,
        description: description,
        isactive: true,
        isdeleted: false,
        stagetypeid: stageTypeId,
        status: ActionStatus.COMPLETED,
        projectid: projectId,
        stagesequence: stageSequence,
        createdat: new Date().toISOString(),
        createdby: tenantUserId
      }
    });
    return newProject;
  } catch (err) {
    throw err;
  }
}

export async function getStageType(name: string) {
  try {
    const prisma = await getPrismaClient();
    const stageType = await prisma.stagetype.findFirst({
      where: {
        name: name,
        isdeleted: false
      }
    });
    return stageType;
  } catch (err) {
    throw err;
  }
}



  export async function getStepByProjectId( tenantUserId: string,
    name: string,
    description: string,
    stepTypeId: string,
    stageId: string,
    stepSequence: number
    ) {
    try {
      const prisma = await getPrismaClient();
      const step = await prisma.step.findFirst({
        where: {
          name: name,
          description :description,
          createdby: tenantUserId,
          stageid: stageId,
          steptypeid: stepTypeId,
          stepsequence: stepSequence
  
        }
      });
      return step;
    } catch (err) {
      throw err;
    }
  
  }

export async function getStageByProjectId( tenantUserId: string,
  name: string,
  description: string,
  stageTypeId: string,
  projectId: string,
  stageSequence: number
) {
  try {
    const prisma = await getPrismaClient();
    const stage = await prisma.stage.findFirst({
      where: {
        projectid: projectId,
        name: name,
        description :description,
        createdby: tenantUserId,
        stagetypeid: stageTypeId,
        stagesequence: stageSequence

      }
    });
    return stage;
  } catch (err) {
    throw err;
  }

}

export async function getStageDetails(projectId: string, stageTypeId: string) {
  try {
    const prisma = await getPrismaClient();
    const stage = await prisma.stage.findFirst({
      where: {
        projectid: projectId,
        stagetypeid: stageTypeId
      },
      include: { steps: true }
    });
    return stage;
  } catch (err) {
    throw err;
  }
}

export async function getStageDetailsByProjectId(projectId: string) {

  const prisma = await getPrismaClient();

const stepDetails = await prisma.stepdetail.findMany({
  where: {
    step: {
      name: 'Read file from s3',
      stage: {
        projectid: projectId,
        name: 'Data Storage',
      },
    },
  },
  select: {
    id: true,
    metadata: true,
  },
});

return stepDetails;

}

export async function getStepDetails(stepId: string) {
  try {
    const prisma = await getPrismaClient();
    const stage = await prisma.stepdetail.findMany({
      where: {
        stepid: stepId
      }
    });
    return stage;
  } catch (err) {
    throw err;
  }
}

export async function getStepType(name: string) {
  try {
    const prisma = await getPrismaClient();
    const stageType = await prisma.steptype.findFirst({
      where: {
        name: name,
        isdeleted: false
      }
    });
    return stageType;
  } catch (err) {
    throw err;
  }
}

export async function createStep(
  tenantUserId: string,
  name: string,
  description: string,
  stepTypeId: string,
  stageId: string,
  stepSequence: number
) {
  console.log("Creating admin stage");
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.step.create({
      data: {
        name: name,
        description: description,
        isactive: true,
        isdeleted: false,
        steptypeid: stepTypeId,
        stageid: stageId,
        stepsequence: stepSequence,
        status: ActionStatus.COMPLETED,
        createdat: new Date().toISOString(),
        createdby: tenantUserId
      }
    });
    return newProject;
  } catch (err) {
    throw err;
  }
}

export async function createStepDetails(tenantUserId: string, metaData: string, stepId: string) {
  console.log("Creating step details",metaData, stepId);
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.stepdetail.create({
      data: {
        isactive: true,
        stepid: stepId,
        status: ActionStatus.COMPLETED,
        isdeleted: false,
        metadata: metaData,
        createdat: new Date().toISOString(),
        createdby: tenantUserId
      }
    });
    return newProject;
  } catch (err) {
    throw err;
  }
}

export async function createStepType(tenant: tenant, name: string, description: string) {
  console.log("Creating admin stage", tenant.id);
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.steptype.create({
      data: {
        name: name,
        description: description,
        tenantid: tenant.id,
        isdeleted: false,
        isactive: true,
        createdat: new Date().toISOString(),
        createdby: tenant.adminuserid ?? ""
      }
    });
    return newProject;
  } catch (err) {
    throw err;
  }
}

export async function createStageType(tenant: tenant, name: string, description: string) {
  console.log("Creating admin stage", tenant.id);
  try {
    const prisma = await getPrismaClient();
    const newProject = await prisma.stagetype.create({
      data: {
        name: name,
        description: description,
        tenantid: tenant.id,
        isdeleted: false,
        isactive: true,
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
    var keyType = getKeyTypeBasedOnChainId(chainType);
    if (key == null) {
      key = await org.createKey(keyType, cubistUserId);
    }

    logWithTrace("Created key", key.materialId);
    const newWallet = await prisma.wallet.create({
      data: {
        customerid: customerId as string,
        walletaddress: deriveDisplayAddressForCustomChains(chainType, key),
        walletid: key.id,
        chaintype: chainType,
        wallettype: keyType.toString(),
        isactive: true,
        createdat: new Date().toISOString(),
        publickey: key.materialId
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
    var keyType = getKeyTypeBasedOnChainId(chainType);
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
          walletaddress: deriveDisplayAddressForCustomChains(chainType, key),
          walletid: key.id,
          chaintype: chainType,
          wallettype: keyType.toString(),
          isactive: true,
          createdat: new Date().toISOString(),
          tenantid: tenantId,
          publickey: key.materialId
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

    await addActivityLog({
      title: 'Category Created',
      description: `Category ${newCategory.name} was created successfully.`,
      loggedBy: category.customerid!,
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
        price: product.price
      }
    });

	 await addActivityLog({
      title: 'Product Created',
      description: `Product ${newProduct.name} was created successfully.`,
      loggedBy: product.customerid!,
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

export async function createProductAttributes(attributes: productattribute[]) {
  try {
    const prisma = await getPrismaClient();
    const newAttribute = await prisma.productattribute.createMany({
      data: attributes,
      skipDuplicates: true
    });
    await addActivityLog({
      title: 'Product Attributes Added',
      description: `Product Attributes were created successfully.`,
      loggedBy: attributes[0].customerid!
    });
    return newAttribute;
  } catch (err) {
    throw err;
  }
}

export async function deleteProductAttributes(productId: string, attributeIds: string[], customerId:string) {
  try {
    const prisma = await getPrismaClient();
    const deletedAttributes = await prisma.productattribute.deleteMany({
      where: {
        productid: productId,
        id: {
          in: attributeIds
        }
      }
    });
    await addActivityLog({
      title: 'Product Attributes Deleted',
      description: `Product Attributes for product ${productId} were deleted successfully.`,
      loggedBy: customerId
    });
    return deletedAttributes;
  } catch (err) {
    throw err;
  }
}

export async function updateCategory(categoryId: string, category: string, customerId:string) {
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

	await addActivityLog({
	  title: 'Category Updated',
	  description: `Category ${updated.name} was updated successfully.`,
	  loggedBy: customerId
	});

    return updated;
  } catch (err) {
    throw err;
  }
}

export async function updateProduct(id: string, product: Partial<product>, customerid: string) {
  try {
    const prisma = await getPrismaClient();

    const updatedProduct = await prisma.product.update({
      where: {
        id: id
      },
      data: product
    });

	await addActivityLog({
	  title: 'Product Updated',
	  description: `Product ${updatedProduct.name} was updated successfully.`,
	  loggedBy: customerid,
	});

    return updatedProduct;
  } catch (err) {
    throw err;
  }
}

export async function updateProductAttributes(productId: string, attributes: productattribute[], customerid: string) {
  try {
    const prisma = await getPrismaClient();
    const results = [];

    for (const attribute of attributes) {
      const { key, value } = attribute;

      await prisma.productattribute.updateMany({
        where: {
          productid: productId,
          key: key
        },
        data: {
          value: value,
          updatedat: new Date()
        }
      });

      const updatedAttribute = await prisma.productattribute.findFirst({
        where: {
          productid: productId,
          key: key
        }
      });

	await addActivityLog({
	  title: 'Product Attributes Updated',
	  description: `Product Attributes for product ${productId} were updated successfully.`,
	  loggedBy: customerid,
	});

      if (updatedAttribute) {
        results.push(updatedAttribute);
      }
    }

    return results;
  } catch (err) {
    console.error("Error updating product attributes:", err);
    throw err;
  }
}

export async function updateProductStatus(productId: string, status: ProductStatus, customerid: string) {
  try {
    const prisma = await getPrismaClient();

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        status: status,
        updatedat: new Date().toISOString()
      }
    });

	await addActivityLog({
	  title: 'Product Status Updated',
	  description: `Product ${updatedProduct.name} status was updated successfully.`,
	  loggedBy: customerid,
	});

    return updatedProduct;
  } catch (err) {
    throw err;
  }
}

export async function deleteProduct(productId: string, customerId:string) {
  try {
    const prisma = await getPrismaClient();

    const deletedProduct = await prisma.product.update({
      where: { id: productId },
      data: { isdeleted: true }
    });

    await addActivityLog({
      title: 'Product Deleted',
      description: `Product ${productId} was deleted successfully.`,
      loggedBy: customerId,
    });

    return deletedProduct;
  } catch (err) {
    throw err;
  }
}

export async function deleteCategory(categoryId: string, customerId:string) {
  try {
    const prisma = await getPrismaClient();

    const deletedCategory = await prisma.productcategory.update({
      where: { id: categoryId },
      data: { isdeleted: true }
    });

    await addActivityLog({
      title: 'Category Deleted',
      description: `Category ${categoryId} was deleted successfully.`,
      loggedBy: customerId,
    });

    return deletedCategory;
  } catch (err) {
    throw err;
  }
}

export async function addReferenceToDb(
  tenantId: string,
  file: any,
  isIngested: boolean,
  projectId: string,
  status: ReferenceStatus,
  isAddedByAdmin: boolean,
  createdBy: string,
  datasource_id?: string,
  ingestionJobId?: string,

) {
  try {
    const prisma = await getPrismaClient();
 
    const newRef = await prisma.reference.create({
      data: {
        tenantid: tenantId as string,
        projectid: projectId,
        referencestage: ReferenceStage.DATA_SOURCE,
        status : status,
        reftype: file.refType,
        name: file.refType == RefType.DOCUMENT ? file.fileName : file.websiteName,
        url: file.refType == RefType.DOCUMENT ? "" : file.websiteUrl,
        size: file.refType == RefType.DOCUMENT ? file.fileSize : null,
        contenttype: file.refType == RefType.DOCUMENT ? file.contentType : null,
        hash: file.hash ,
        ingested: isIngested,
        isdeleted: false,
        datasourceid: datasource_id,
        ingestionjobid: ingestionJobId,
        depth: file.depth,
        createdby:createdBy,
        isactive: true,
        isaddedbyadmin:isAddedByAdmin,
        createdat: new Date().toISOString()
      }
    });
    return {
      data: newRef,
      error: null
    };
  } catch (err) {
    return {
      data: null,
      error: err
    };
  }
}


export async function addReferences(
  tenantId: string,
  tenantUserId: string,
  projectId: string,
  files: any[],
  bucketName: string
) {
  try {
    // Prepare batch data
    const referencesData = files.map((file) => ({
      tenantid: tenantId,
      projectid: projectId,
      referencestage: ReferenceStage.DATA_SOURCE,
      status: ReferenceStatus.PENDING,
      reftype: file.refType,
      name: file.refType === RefType.DOCUMENT ? file.fileName : file.websiteName,
      url: file.refType === RefType.DOCUMENT ? "" : file.websiteUrl,
      size: file.refType === RefType.DOCUMENT ? file.fileSize : null,
      contenttype: file.refType === RefType.DOCUMENT ? file.contentType : null,
      hash: file.hash,
      ingested: false,
      isdeleted: false,
      datasourceid: null,
      ingestionjobid: null,
      depth: file.depth,
      createdby: tenantUserId,
      isactive: true,
      isaddedbyadmin: true,
      createdat: new Date().toISOString(),
    }));

    // Perform batch insert
    const prisma = await getPrismaClient();
    const createdReferences = await prisma.reference.createMany({
      data: referencesData,
      skipDuplicates: true, // Skips duplicates based on unique constraints
    });

    console.log(`Successfully added ${createdReferences.count} references.`);
    return { data: createdReferences, error: null };
  } catch (err) {
    console.error("Error adding references:", err);
    return { data: null, error: err };
  }
}


export async function addRefTransaction(
  tenantId: string,
  refId: string,
  hash: string,
  projectId: string,
  txHash: string,
  chainId: string,
  chainType: string,
  network: string,
  status: string
) {
  try {
    const prisma = await getPrismaClient();

    const newRefTx = await prisma.referencetransaction.create({
      data: {
        tenantid: tenantId as string,
        projectid: projectId,
        refid: refId,
        hash: hash,
        txhash: txHash,
        chainid: chainId,
        chaintype: chainType,
        network: network,
        status: status,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        isactive: true
      }
    });
    return {
      data: newRefTx,
      error: null
    };
  } catch (err) {
    return {
      data: null,
      error: err
    };
  }
}

export async function addDocumentReference(
  tenantId: string,
  file: any,
  refType: string,
  isIngested: boolean,
  projectId: string,
  createdby: string,
  datasource_id?: string,
  data?: any,
  ingestionJobId?: string,
) {
  try {
    const prisma = await getPrismaClient();

    const newRef = await prisma.reference.create({
      data: {
        tenantid: tenantId as string,
        projectid: projectId,
        referencestage: ReferenceStage.DATA_SOURCE,
        hash: file.hash,
        reftype: refType,
        name: file.fileName,
        contenttype: file.contentType,
        isaddedbyadmin:true,
        url: data.url,
        size: data.size,
        ingested: isIngested,
        isdeleted: false,
        status : ReferenceStatus.PROCESSING,
        createdby : createdby,
        datasourceid: datasource_id,
        ingestionjobid: ingestionJobId,
        depth: 0,
        isactive: true,
        createdat: new Date().toISOString()
      }
    });
    return {
      data: newRef,
      error: null
    };
  } catch (err) {
    return {
      data: null,
      error: err
    };
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
    };
  } else {
    return {
      isExist: false,
      error: null
    };
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
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function isProjectExist(projectType: ProjectType, name: string, organizationId: string) {
  const prisma = await getPrismaClient();
  const existingProject = await prisma.project.findFirst({
    where: {
      name: name,
      projecttype: projectType,
      organizationid: organizationId
    }
  });
  if (existingProject) {
    return {
      isExist: true,
      error: "Project is already added with this name"
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function isStageExist(name: string) {
  const prisma = await getPrismaClient();
  const existingProject = await prisma.stage.findFirst({
    where: {
      name: name
    }
  });
  if (existingProject) {
    return {
      isExist: true,
      error: "Stage is already added with this name"
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function isStageTypeExist(name: string) {
  const prisma = await getPrismaClient();
  const existing = await prisma.stagetype.findFirst({
    where: {
      name: name
    }
  });
  if (existing) {
    return {
      isExist: true,
      error: "Stage Type is already added with this name"
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function isStepExist(name: string) {
  const prisma = await getPrismaClient();
  const existing = await prisma.step.findFirst({
    where: {
      name: name
    }
  });
  if (existing) {
    return {
      isExist: true,
      error: "Step is already added with this name"
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function isStepTypeExist(name: string) {
  const prisma = await getPrismaClient();
  const existing = await prisma.steptype.findFirst({
    where: {
      name: name
    }
  });
  if (existing) {
    return {
      isExist: true,
      error: "Step Type is already added with this name"
    };
  } else {
    return {
      isExist: false,
      error: null
    };
  }
}

export async function getDataSourcesCount(tenantId: string, refType: string) {
  try {
    const prisma = await getPrismaClient();

    const result = await prisma.reference.groupBy({
      by: ["datasourceid"], // Group by the `datasourceId` field
      _count: {
        id: true // Count the number of rows (assuming `id` is a unique identifier)
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
      return filteredResults[0].datasourceid; // Return the first result
    } else {
      return null; // Return null if no datasourceId has a count less than 10
    }
  } catch (error) {
    console.error("Error fetching datasource counts:", error);
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

export async function getReferenceByProjectId(projectId: string,referenceStage: ReferenceStage,status : ReferenceStatus) {
  try {
    const prisma = await getPrismaClient();
    const reference = await prisma.reference.findMany({
      where: {
        projectid: projectId,
        referencestage: referenceStage,
        status: status,
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

export async function getReferenceList(limit: number, pageNo: number, tenantId: string, refType: string, status: ReferenceStatus) {
  try {
    const prisma = await getPrismaClient();
    const refCount = await prisma.reference.count({
      where: {
        tenantid: tenantId,
        reftype: refType,
        isdeleted: false,
        isaddedbyadmin:false,
        status: status
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
        status: status
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

export async function getReferenceListByCustomer(limit: number, pageNo: number, tenantId: string, customerId: string) {
  try {
    const prisma = await getPrismaClient();
    const refCount = await prisma.reference.count({
      where: {
        tenantid: tenantId,
        isdeleted: false,
        createdby: customerId,
        isaddedbyadmin:false
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
        isdeleted: false,
        createdby: customerId
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

export async function getListOfStageTypeAndStepType(limit: number, pageNo: number, tenantId: string, type: string) {
  try {
    const prisma = await getPrismaClient();

    if (type == "STAGETYPE") {
      const refCount = await prisma.stagetype.count({
        where: {
          tenantid: tenantId,
          isdeleted: false
        },
        orderBy: {
          createdat: "desc"
        }
      });
      if (refCount == 0) {
        return [];
      }
      const refs = await prisma.stagetype.findMany({
        where: {
          tenantid: tenantId,
          isdeleted: false
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
        data: refs
      };

      return data;
    } else if (type == "STEPTYPE") {
      const refCount = await prisma.steptype.count({
        where: {
          tenantid: tenantId,
          isdeleted: false
        },
        orderBy: {
          createdat: "desc"
        }
      });
      if (refCount == 0) {
        return [];
      }
      const refs = await prisma.steptype.findMany({
        where: {
          tenantid: tenantId,
          isdeleted: false
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
        data: refs
      };

      return data;
    }

    return null;
  } catch (err) {
    throw err;
  }
}

export async function getProjectList(limit: number, pageNo: number, organizationId: string) {
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

export async function getProjectByIdWithRef(projectId: string, limit: number, pageNo: number) {
  try {
    const prisma = await getPrismaClient();
    const project = await prisma.project.findFirst({
      where: {
        id: projectId
      }
    });
    if (project == null) {
      return { data: null, error: "Project not found" };
    }
    const refCount = await prisma.reference.count({
      where: {
        projectid: projectId,
        isdeleted: false
      },
      orderBy: {
        createdat: "desc"
      }
    });

    const refs = await prisma.reference.findMany({
      where: {
        projectid: projectId,
        isdeleted: false
      },

      orderBy: {
        createdat: "desc"
      },
      take: limit,
      skip: (pageNo - 1) * limit
    });

    const data = {
      project: project,
      references: {
        total: refCount,
        totalPages: Math.ceil(refCount / limit),
        refs: refs
      }
    };

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getProjectById(projectId: string) {
  try {
    const prisma = await getPrismaClient();
    const project = await prisma.project.findFirst({
      where: {
        id: projectId
      }
    });
    if (project == null) {
      return { data: null, error: "Project not found" };
    }
    return { data: project, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
export async function getRefById(refId: string) {
  try {
    const prisma = await getPrismaClient();
    const project = await prisma.reference.findFirst({
      where: {
        id: refId
      }
    });
    if (project == null) {
      return { data: null, error: "Reference not found" };
    }
    return { data: project, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}
export async function getProjectWithSteps(projectId: string, limit: number, pageNo: number) {
  try {
    const prisma = await getPrismaClient();
    const project = await prisma.project.findFirst({
      where: {
        id: projectId
      },  
      include :{references: true}

    });

    const stageCount = await prisma.stage.count({
      where: {
        projectid: projectId,
        isdeleted: false
      },
      orderBy: {
        stagesequence: "asc"
      }
    });

    const stages = await prisma.stage.findMany({
      where: {
        projectid: projectId,
        isdeleted: false
      },
      include: {
        steps: {
          include: {
            stepdetails: true
          },
          orderBy: {
            stepsequence: "asc" // Sort steps within each stage by 'stepsequence' column
          }
        }      },
      orderBy: {
        stagesequence: "asc"
      },

      take: limit,
      skip: (pageNo - 1) * limit
    });

    if (project == null) {
      return { data: null, error: "Project not found" };
    }
    const projectData = {
      project: project,
      stagedata: {
        total: stageCount,
        totalPages: Math.ceil(stageCount / limit),
        stages: stages
      }
    };
    const data = {
      project: projectData
    };
    console.log(data);

    return { data, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

export async function getAllProjects() {
  try {
    const prisma = await getPrismaClient();
    const transactions = await prisma.project.findMany({
      where: {
        projectstage: ProjectStage.DATA_SOURCE || ProjectStage.DATA_PREPARATION
      }
    });
    return transactions;
  } catch (err) {
    throw err;
  }
}

export async function getAllReferences() {
  try {
    const prisma = await getPrismaClient();
    const transactions = await prisma.reference.findMany({
      where: {
        referencestage: ReferenceStage.DATA_STORAGE || ReferenceStage.DATA_SOURCE
      }
    });
    return transactions;
  } catch (err) {
    throw err;
  }
}

export async function getAdminProductsByTenantId(offset: number, limit: number, tenantId: string) {
  try {
    const prisma = await getPrismaClient();

    const products = await prisma.product.findMany({
      where: {
        tenantid: tenantId,
        isdeleted: false
      },
      skip: offset,
      take: limit,
      include: {
        productmedia: true,
        inventories: true
      }
    });

    const totalCount = await prisma.product.count({
      where: {
        tenantid: tenantId,
        isdeleted: false
      }
    });

    // Add totalquantity and inventorystatus for each product
    const productsWithInventoryData = products.map((product: { inventories: any[] }) => {
      const totalquantity = product.inventories.reduce((sum: number, inventory: productinventory) => sum + inventory.quantity, 0);
      const inventorystatus = totalquantity > 0 ? "In Stock" : "Out of Stock";

      return {
        ...product,
        totalquantity,
        inventorystatus
      };
    });

    return { products: productsWithInventoryData, totalCount };
  } catch (err) {
    throw err;
  }
}

export async function createInventory(inventoryData: productinventory) {
  try {
    const prisma = await getPrismaClient();

    // Create the main product inventory entry
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

    // Create the sensory data if provided
    if (inventoryData.sensorydata) {
      const sensor = inventoryData.sensorydata;
      await prisma.productsensorydata.create({
        data: {
          inventoryid: newInventory.id,
          temprature: sensor.temprature,
          oxygen: sensor.oxygen,
          humidity: sensor.humidity,
          ph: sensor.ph,
          alcohol: sensor.alcohol,
          location: sensor.location
        }
      });
    }

    // Fetch the newly created inventory along with its sensory data
    const inventoryWithSensoryData = await prisma.productinventory.findUnique({
      where: { id: newInventory.id },
      include: { sensorydata: true }
    });

    await addActivityLog({
      title: 'Inventory Created',
      description: `Inventory ${newInventory.id} was created successfully.`,
      loggedBy: inventoryData.customerid!,
    });

    return inventoryWithSensoryData;
  } catch (error) {
    console.error("Error in createInventory:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while creating the inventory");
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
        id: productId
      }
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
      include: {
        sensorydata: true
      },
      skip: offset,
      take: limit
    });

    const totalCount = await prisma.productinventory.count({
      where: {
        productid: productId,
        isdeleted: false
      }
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

export async function updateInventory(inventoryId: string, updateData: productinventory, customerid: string) {
  const prisma = await getPrismaClient();

  try {
    const sensoryData: productsensorydata | undefined = updateData.sensorydata;

    const updatedInventory = await prisma.productinventory.update({
      where: {
        id: inventoryId
      },
      data: updateData
    });
    if (sensoryData) {
      const existingSensoryData = await prisma.productsensorydata.findUnique({
        where: { inventoryid: inventoryId }
      });
      if (existingSensoryData) {
        await prisma.productsensorydata.update({
          where: { id: existingSensoryData.id },
          data: {
            ...(sensoryData.temprature !== undefined && { temprature: sensoryData.temprature }),
            ...(sensoryData.oxygen !== undefined && { oxygen: sensoryData.oxygen }),
            ...(sensoryData.humidity !== undefined && { humidity: sensoryData.humidity }),
            ...(sensoryData.ph !== undefined && { ph: sensoryData.ph }),
            ...(sensoryData.alcohol !== undefined && { alcohol: sensoryData.alcohol }),
            ...(sensoryData.location !== undefined && { location: sensoryData.location })
          }
        });
      } else {
        await prisma.productsensorydata.create({
          data: {
            inventoryid: inventoryId,
            temprature: sensoryData.temprature,
            oxygen: sensoryData.oxygen,
            humidity: sensoryData.humidity,
            ph: sensoryData.ph,
            alcohol: sensoryData.alcohol,
            location: sensoryData.location
          }
        });
      }
    }

    await addActivityLog({
      title: "Inventory Updated",
      description: `Inventory ${inventoryId} was updated successfully.`,
      loggedBy: customerid
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

export async function createBulkInventory(inventoryDataArray: productinventory[], productId: string, customerId:string) {
  try {
    const prisma = await getPrismaClient();

    const existingInventories = await prisma.productinventory.findMany({
      where: {
        productid: productId,
        inventoryid: {
          in: inventoryDataArray.map((data) => data.inventoryid)
        }
      },
      select: { inventoryid: true }
    });


    const existingIds = new Set(existingInventories.map((item: { inventoryid: any; }) => item.inventoryid));


    const newInventories = inventoryDataArray.filter(
      (data) => !existingIds.has(data.inventoryid)
    );


    await prisma.productinventory.createMany({
      data: newInventories.map((inventoryData) => ({
        inventoryid: inventoryData.inventoryid,
        productid: productId,
        inventorycategory: inventoryData.inventorycategory,
        price: inventoryData.price,
        quantity: inventoryData.quantity,
        ownershipnft: inventoryData.ownershipnft ?? false,
        smartcontractaddress: inventoryData.smartcontractaddress,
        tokenid: inventoryData.tokenid,
        isdeleted: false,
        createdat: new Date(),
        updatedat: new Date()
      })),
      skipDuplicates: true
    });


    const createdInventoryRecords = await prisma.productinventory.findMany({
      where: {
        inventoryid: {
          in: newInventories.map(data => data.inventoryid),
        },
        productid: productId,
      },
    //   select: { id: true, inventoryid: true }
    });

	console.log(createdInventoryRecords);


    const skippedIds = inventoryDataArray
      .map((data) => data.inventoryid)
      .filter((id) => existingIds.has(id));


      await addActivityLog({
        title: 'Bulk Inventory created',
        description: `Bulk Inventory against product id ${productId} created successfully.`,
        loggedBy: customerId!,
      });

    return {
      created: createdInventoryRecords,
      skipped: skippedIds,
      message: skippedIds.length
        ? `Some items were not created due to duplication: ${skippedIds.join(", ")}`
        : "All items created successfully."
    };
  } catch (error) {
    console.error("Error in createBulkInventory:", error);
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the inventory");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}



export async function createBulkProduct(productDataArray: product[], customerId:string) {
  try {
    const prisma = await getPrismaClient();

    const createdProducts = await prisma.$transaction(async (tx) => {
      // Step 1: Create products in bulk
      await tx.product.createMany({
        data: productDataArray.map((productData) => ({
          name: productData.name,
          description: productData.description,
          type: productData.type,
          sku: productData.sku,
          rarity: productData.rarity,
          price: productData.price,
          categoryid: productData.categoryid,
          tenantid: productData.tenantid
        })),
        skipDuplicates: true
      });

      // Step 2: Fetch the created products using their names or SKUs
      return tx.product.findMany({
        where: {
          sku: {
            in: productDataArray.map((data) => data.sku)
          }
        }
      });
    });

    await addActivityLog({
      title: 'Bulk Products created',
      description: `Bulk Products created successfully.`,
      loggedBy: customerId!,
    });

    return createdProducts;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || "An error occurred while adding the products");
    } else {
      throw new Error("An unexpected error occurred.");
    }
  }
}

export async function deleteInventory(inventoryId: string, customerId: string) {
  try {
    const prisma = await getPrismaClient();

    const deletedInventory = await prisma.productinventory.update({
      where: { id: inventoryId },
      data: { isdeleted: true }
    });

    await addActivityLog({
      title: 'Inventory Deleted',
      description: `Inventory ${inventoryId} was deleted successfully.`,
      loggedBy: customerId!,
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
          { inventoryid: { contains: searchKeyword.trim(), mode: "insensitive" } },
          { product: { name: { contains: searchKeyword.trim(), mode: "insensitive" } } }
        ]
      },
      include: {
        product: true,
        sensorydata: true
      }
    });

    return searchResult;
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
      isdeleted: false
    };

    if (filters.inventoryid) {
      whereClause.inventoryid = {
        contains: filters.inventoryid,
        mode: "insensitive"
      };
    }

    if (filters.productname) {
      whereClause.product = {
        name: {
          contains: filters.productname,
          mode: "insensitive"
        }
      };
    }

    if (filters.price) {
      const { operator, value } = filters.price;
      if (operator === "lt") {
        whereClause.price = { lt: value };
      } else if (operator === "gt") {
        whereClause.price = { gt: value };
      } else if (operator === "eq") {
        whereClause.price = value;
      } else if (operator === "gte") {
        whereClause.price = { gte: value };
      } else if (operator === "lte") {
        whereClause.price = { lte: value };
      }
    }

    if (filters.quantity) {
      const { operator, value } = filters.quantity;
      if (operator === "lt") {
        whereClause.quantity = { lt: value };
      } else if (operator === "gt") {
        whereClause.quantity = { gt: value };
      } else if (operator === "eq") {
        whereClause.quantity = value;
      } else if (operator === "gte") {
        whereClause.quantity = { gte: value };
      } else if (operator === "lte") {
        whereClause.quantity = { lte: value };
      }
    }

    const filteredResult = await prisma.productinventory.findMany({
      where: whereClause,
      include: {
        product: true,
        sensorydata: true
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

export async function insertMediaEntries(mediaData: any[], customerId:string) {
  try {
    const prisma = await getPrismaClient();
    const newMediaEntries = await prisma.media.createMany({
      data: mediaData
    });
    await addActivityLog({
      title: 'Media Inserted',
      description: `Media Inserted successfully.`,
      loggedBy: customerId
    });
    return newMediaEntries;
  } catch (error: any) {
    throw new Error(`Error inserting media entries: ${error.message}`);
  }
}

export async function deleteMediaEntries(mediaUrls: string[], productId: string, customerId:string) {
  try {
    const prisma = await getPrismaClient();
    await prisma.media.deleteMany({
      where: {
        entityid: productId,
        url: { in: mediaUrls }
      }
    });
    await addActivityLog({
      title: 'Media Entries Deleted',
      description: `Media Entries for product ${productId} were deleted successfully.`,
      loggedBy: customerId
    });
  } catch (error: any) {
    throw new Error(`Error deleting media entries: ${error.message}`);
  }
}

export async function addOwnership(inventoryId: string, customerId: string) {
  try {
    const prisma = await getPrismaClient();
    await prisma.productownership.create({
      data: {
        inventoryid: inventoryId,
        customerid: customerId
      }
    });

    await addActivityLog({
      title: 'Ownership Added',
      description: `Ownership against inventory ${inventoryId} was created successfully.`,
      loggedBy: customerId!,
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

export async function addActivityLog(logData: activitylogs) {
  try {
    const prisma = await getPrismaClient();

    await prisma.activitylogs.create({
      data: {
        title: logData.title,
        description: logData.description,
        loggedby: logData.loggedBy,
      }
    });
  } catch (error: any) {
    throw new Error(`Error adding activity log: ${error.message}`);
  }
}

export async function getActivityLogs() {
  try {
	const prisma = await getPrismaClient();
	const activityLogs = prisma.activitylogs.findMany({
      include: {
         customer: true 
      },
      orderBy: {
        createdat: 'desc'
      },
      take: 10
    });

	return activityLogs;
  } catch (error: any) {
	throw new Error(`Error fetching activity logs: ${error.message}`);
  }
}