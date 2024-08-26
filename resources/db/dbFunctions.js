"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClient = getPrismaClient;
exports.createCustomer = createCustomer;
exports.createAdminUser = createAdminUser;
exports.createWalletAndKey = createWalletAndKey;
exports.createWallet = createWallet;
exports.createAdminWallet = createAdminWallet;
exports.insertTransaction = insertTransaction;
exports.insertStakingTransaction = insertStakingTransaction;
exports.insertStakeAccount = insertStakeAccount;
exports.insertCustomerKyc = insertCustomerKyc;
exports.mergeDbStakeAccounts = mergeDbStakeAccounts;
exports.removeStakeAccount = removeStakeAccount;
exports.insertMergeStakeAccountsTransaction = insertMergeStakeAccountsTransaction;
exports.createWithdrawTransaction = createWithdrawTransaction;
exports.getStakeAccounts = getStakeAccounts;
exports.getMasterValidatorNode = getMasterValidatorNode;
exports.getStakeAccount = getStakeAccount;
exports.getCustomerKycByTenantId = getCustomerKycByTenantId;
exports.getCustomerKyc = getCustomerKyc;
exports.getWalletByCustomer = getWalletByCustomer;
exports.getAdminWalletByAdmin = getAdminWalletByAdmin;
exports.getCustomerAndWallet = getCustomerAndWallet;
exports.getPayerWallet = getPayerWallet;
exports.getMasterWalletAddress = getMasterWalletAddress;
exports.getTransactionByTenantTransactionId = getTransactionByTenantTransactionId;
exports.getStakingTransactionByStakeAccountId = getStakingTransactionByStakeAccountId;
exports.getStakeAccountById = getStakeAccountById;
exports.getWalletAndTokenByWalletAddress = getWalletAndTokenByWalletAddress;
exports.getWalletAndTokenByWalletAddressBySymbol = getWalletAndTokenByWalletAddressBySymbol;
exports.getWallet = getWallet;
exports.getToken = getToken;
exports.getTokenBySymbol = getTokenBySymbol;
exports.getFirstWallet = getFirstWallet;
exports.getCustomerWalletsByCustomerId = getCustomerWalletsByCustomerId;
exports.CustomerAndWalletCounts = CustomerAndWalletCounts;
exports.getTransactionsByWalletAddress = getTransactionsByWalletAddress;
exports.getStakeTransactions = getStakeTransactions;
exports.getAllTransactions = getAllTransactions;
exports.getAllCustomerWalletForBonus = getAllCustomerWalletForBonus;
exports.getAllCustomerAndWalletByTenant = getAllCustomerAndWalletByTenant;
exports.getAllStakingTransactions = getAllStakingTransactions;
exports.getTenantCallBackUrl = getTenantCallBackUrl;
exports.getCubistConfig = getCubistConfig;
exports.getMasterSumsubConfig = getMasterSumsubConfig;
exports.updateTransaction = updateTransaction;
exports.updateCustomerKycStatus = updateCustomerKycStatus;
exports.deleteCustomer = deleteCustomer;
exports.deleteWallet = deleteWallet;
exports.updateCustomerBonusStatus = updateCustomerBonusStatus;
exports.getStakingTransactionByTenantTransactionId = getStakingTransactionByTenantTransactionId;
exports.updateStakeAccountStatus = updateStakeAccountStatus;
exports.decreaseStakeAmount = decreaseStakeAmount;
exports.updateStakeAccount = updateStakeAccount;
exports.updateStakeAccountAmount = updateStakeAccountAmount;
exports.duplicateStakeAccount = duplicateStakeAccount;
exports.reduceStakeAccountAmount = reduceStakeAccountAmount;
exports.updateStakingTransaction = updateStakingTransaction;
exports.getCustomer = getCustomer;
exports.getAdminUser = getAdminUser;
exports.getStakeAccountPubkeys = getStakeAccountPubkeys;
const client_1 = require("@prisma/client");
const models_1 = require("./models");
const cs = __importStar(require("@cubist-labs/cubesigner-sdk"));
const PgClient_1 = require("./PgClient");
const utils_1 = require("../utils/utils");
let prismaClient;
async function getPrismaClient() {
    if (prismaClient) {
        return prismaClient;
    }
    const databaseUrl = await (0, PgClient_1.getDatabaseUrl)();
    prismaClient = new client_1.PrismaClient({
        datasourceUrl: databaseUrl
    });
    return prismaClient;
}
async function createCustomer(customer) {
    try {
        const prisma = await getPrismaClient();
        const newCustomer = await prisma.customer.create({
            data: {
                tenantuserid: customer.tenantuserid,
                tenantid: customer.tenantid,
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
    }
    catch (err) {
        throw err;
    }
}
async function createAdminUser(customer) {
    try {
        const prisma = await getPrismaClient();
        const newCustomer = await prisma.adminuser.create({
            data: {
                tenantuserid: customer.tenantuserid,
                tenantid: customer.tenantid,
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
    }
    catch (err) {
        throw err;
    }
}
async function createWalletAndKey(org, cubistUserId, chainType, customerId, key) {
    try {
        const prisma = await getPrismaClient();
        console.log("Creating wallet", cubistUserId, customerId, key);
        if (key == null) {
            key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
        }
        (0, utils_1.logWithTrace)("Created key", key.materialId);
        const newWallet = await prisma.wallet.create({
            data: {
                customerid: customerId,
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
    }
    catch (err) {
        throw err;
    }
}
async function createWallet(org, cubistUserId, chainType, customerId) {
    try {
        console.log("Creating wallet", cubistUserId, chainType);
        var keyType;
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
                    customerid: customerId,
                    walletaddress: key.materialId,
                    walletid: key.id,
                    chaintype: chainType,
                    wallettype: keyType.toString(),
                    isactive: true,
                    createdat: new Date().toISOString()
                }
            });
            return { data: newWallet, error: null };
        }
        else {
            return { data: null, error: "Chain type not supported for key generation" };
        }
    }
    catch (err) {
        throw err;
    }
}
async function createAdminWallet(org, cubistUserId, chainType, tenantId, customerId) {
    try {
        console.log("Creating wallet", cubistUserId, chainType);
        var keyType;
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
                    adminuserid: customerId,
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
        }
        else {
            return { data: null, error: "Chain type not supported for key generation" };
        }
    }
    catch (err) {
        throw err;
    }
}
async function insertTransaction(senderWalletAddress, receiverWalletaddress, amount, chainType, symbol, txhash, tenantId, customerId, tokenId, tenantUserId, network, status, tenantTransactionId, error) {
    try {
        const prisma = await getPrismaClient();
        const newTransaction = await prisma.transaction.create({
            data: {
                customerid: customerId,
                callbackstatus: models_1.CallbackStatus.PENDING,
                tokenid: tokenId,
                tenanttransactionid: tenantTransactionId,
                network: network,
                status: status,
                error: error,
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
    }
    catch (err) {
        throw err;
    }
}
async function insertStakingTransaction(senderWalletAddress, receiverWalletaddress, amount, chainType, symbol, txhash, tenantId, customerId, tokenId, tenantUserId, network, status, tenantTransactionId, stakeaccountpubkey, stakeaccountid, stakeType, error) {
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
                error: error,
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
    }
    catch (err) {
        throw err;
    }
}
async function insertStakeAccount(senderWalletAddress, receiverWalletaddress, amount, chainType, symbol, tenantId, customerId, tenantUserId, network, status, tenantTransactionId, stakeaccountpubkey, lockupExpirationTimestamp, error) {
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
    }
    catch (err) {
        throw err;
    }
}
async function insertCustomerKyc(customerKyc, kycType, tenantId, error) {
    try {
        const prisma = await getPrismaClient();
        const newCustomerKyc = await prisma.customerkyc.create({
            data: {
                customerid: customerKyc.externalUserId,
                kyctype: kycType,
                type: customerKyc.type,
                kycid: customerKyc.id,
                status: customerKyc.review.reviewStatus,
                error: error,
                tenantid: tenantId,
                isactive: true,
                createdat: new Date().toISOString(),
                updatedat: new Date().toISOString()
            }
        });
        return newCustomerKyc;
    }
    catch (err) {
        throw err;
    }
}
async function mergeDbStakeAccounts(sourceStakeAccountPubkey, targetStakeAccountPubkey) {
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
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function removeStakeAccount(stakeaccountpubkey) {
    try {
        const prisma = await getPrismaClient();
        const deletedStakeAccount = await prisma.stakeaccount.deleteMany({
            where: { stakeaccountpubkey: stakeaccountpubkey }
        });
        return deletedStakeAccount;
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function insertMergeStakeAccountsTransaction(sourceStakeAccountPubkey, targetStakeAccountPubkey, txhash) {
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
            data: { status: models_1.StakeAccountStatus.MERGED, updatedat: new Date().toISOString() }
        });
        const sourceStakeTransaction = await prisma.staketransaction.findFirst({
            where: { stakeaccountid: sourceAccount.id }
        });
        const mergeTransaction = await prisma.staketransaction.create({
            data: {
                customerid: targetAccount.customerid,
                type: "MERGE",
                tokenid: sourceStakeTransaction.tokenid,
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
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function createWithdrawTransaction(stakeaccountpubkey, txhash) {
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
                tokenid: sourceStakeTransaction.tokenid,
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
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function getStakeAccounts(senderWalletAddress, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const stakeAccounts = await prisma.stakeaccount.findMany({
            where: {
                walletaddress: senderWalletAddress,
                tenantid: tenantId
            }
        });
        return stakeAccounts.length > 0 ? stakeAccounts : null;
    }
    catch (err) {
        throw err;
    }
}
async function getMasterValidatorNode(chainType) {
    try {
        const prisma = await getPrismaClient();
        const validatorNode = await prisma.validatornodes.findFirst({
            where: {
                ismaster: true,
                chaintype: chainType
            }
        });
        return validatorNode ? validatorNode : null;
    }
    catch (err) {
        throw err;
    }
}
async function getStakeAccount(senderWalletAddress, tenantId, customerId) {
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
    }
    catch (err) {
        throw err;
    }
}
async function getCustomerKycByTenantId(customerId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const customerKyc = await prisma.customerkyc.findFirst({
            where: {
                customerid: customerId,
                tenantid: tenantId
            }
        });
        return customerKyc ? customerKyc : null;
    }
    catch (err) {
        throw err;
    }
}
async function getCustomerKyc(customerId) {
    try {
        const prisma = await getPrismaClient();
        const customerKyc = await prisma.customerkyc.findFirst({
            where: {
                customerid: customerId
            }
        });
        return customerKyc ? customerKyc : null;
    }
    catch (err) {
        throw err;
    }
}
async function getWalletByCustomer(tenantUserId, chaintype, tenant) {
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
        if (wallet?.wallets.length == 0 || wallet == null)
            return null;
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
    }
    catch (err) {
        throw err;
    }
}
async function getAdminWalletByAdmin(tenantUserId, chaintype, tenant) {
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
        if (wallet?.adminwallets.length == 0 || wallet == null)
            return null;
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
    }
    catch (err) {
        throw err;
    }
}
async function getCustomerAndWallet(tenantUserId, chaintype, tenant) {
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
        if (wallet == null)
            return null;
        return wallet ? wallet : null;
    }
    catch (err) {
        throw err;
    }
}
async function getPayerWallet(chaintype, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const payerWallet = await prisma.gaspayerwallet.findFirst({
            where: {
                tenantid: tenantId,
                symbol: chaintype
            }
        });
        return payerWallet ? payerWallet : null;
    }
    catch (err) {
        throw err;
    }
}
async function getMasterWalletAddress(chaintype, tenantId, symbol) {
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
    }
    catch (err) {
        throw err;
    }
}
async function getTransactionByTenantTransactionId(tenantTransactionId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const transaction = await prisma.transaction.findFirst({
            where: {
                tenantid: tenantId,
                tenanttransactionid: tenantTransactionId
            }
        });
        return transaction ? transaction : null;
    }
    catch (err) {
        throw err;
    }
}
async function getStakingTransactionByStakeAccountId(stakeAccountId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const stakingTransaction = await prisma.staketransaction.findFirst({
            where: {
                tenantid: tenantId,
                stakeaccountid: stakeAccountId
            }
        });
        return stakingTransaction ? stakingTransaction : null;
    }
    catch (err) {
        throw err;
    }
}
async function getStakeAccountById(stakeAccountId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const stakeAccount = await prisma.stakeaccount.findFirst({
            where: {
                tenantid: tenantId,
                id: stakeAccountId
            }
        });
        return stakeAccount ? stakeAccount : null;
    }
    catch (err) {
        throw err;
    }
}
async function getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol) {
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
        }
        else {
            tokens = await prisma.token.findMany({
                where: { chaintype: wallet?.chaintype || "", symbol: symbol }
            });
        }
        const walletsWithChainTypePromises = tokens.map(async (t) => {
            const wallet = await prisma.wallet.findFirst({
                where: { chaintype: t.chaintype, walletaddress: walletAddress }
            });
            return { ...t, ...wallet, tokenname: t.name, tokenid: t.id };
        });
        return await Promise.all(walletsWithChainTypePromises);
    }
    catch (err) {
        throw err;
    }
}
async function getWalletAndTokenByWalletAddressBySymbol(walletAddress, tenant, symbol) {
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
        const walletsWithChainTypePromises = tokens.map(async (t) => {
            const wallet = await prisma.wallet.findFirst({
                where: { chaintype: t.chaintype, walletaddress: walletAddress }
            });
            return { ...t, ...wallet, tokenname: t.name, tokenid: t.id };
        });
        return await Promise.all(walletsWithChainTypePromises);
    }
    catch (err) {
        throw err;
    }
}
async function getWallet(walletAddress) {
    try {
        const prisma = await getPrismaClient();
        const wallet = await prisma.wallet.findFirst({
            where: { walletaddress: walletAddress }
        });
        return wallet;
    }
    catch (err) {
        throw err;
    }
}
async function getToken(symbol) {
    try {
        const prisma = await getPrismaClient();
        const token = await prisma.token.findFirst({
            where: { symbol: symbol }
        });
        return token;
    }
    catch (err) {
        throw err;
    }
}
async function getTokenBySymbol(symbol) {
    try {
        const prisma = await getPrismaClient();
        const token = await prisma.token.findFirst({
            where: { symbol: symbol }
        });
        return token;
    }
    catch (err) {
        throw err;
    }
}
async function getFirstWallet(walletAddress, tenant, symbol) {
    const wallet = await getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol);
    if (wallet.length == 0)
        return null;
    return wallet[0];
}
async function getCustomerWalletsByCustomerId(customerid, tenant) {
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
    }
    catch (err) {
        throw err;
    }
}
async function CustomerAndWalletCounts(tenant) {
    try {
        const prisma = await getPrismaClient();
        const wallet = await prisma.wallet.count({});
        //const customer = await prisma.customer.count({where:{tenantid:tenant.id}});
        return { wallet };
    }
    catch (err) {
        throw err;
    }
}
async function getTransactionsByWalletAddress(walletAddress, tenant, symbol) {
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
        return transactions.map((t) => {
            return { ...t, ...(token || {}) };
        });
    }
    catch (err) {
        throw err;
    }
}
async function getStakeTransactions(stakeaccountid, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const stakeTransactions = await prisma.staketransaction.findMany({
            where: {
                stakeaccountid: stakeaccountid,
                tenantid: tenantId
            }
        });
        return stakeTransactions;
    }
    catch (err) {
        throw err;
    }
}
async function getAllTransactions() {
    try {
        const prisma = await getPrismaClient();
        const transactions = await prisma.transaction.findMany({
            where: {
                status: "PENDING"
            }
        });
        return transactions;
    }
    catch (err) {
        throw err;
    }
}
async function getAllCustomerWalletForBonus(tenantId) {
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
    }
    catch (err) {
        throw err;
    }
}
async function getAllCustomerAndWalletByTenant(tenantId) {
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
    }
    catch (err) {
        throw err;
    }
}
async function getAllStakingTransactions() {
    try {
        const prisma = await getPrismaClient();
        const stakingTransactions = await prisma.staketransaction.findMany({
            where: {
                status: "PENDING"
            }
        });
        return stakingTransactions;
    }
    catch (err) {
        throw err;
    }
}
async function getTenantCallBackUrl(tenantId) {
    try {
        const prisma = await getPrismaClient();
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId }
        });
        return tenant;
    }
    catch (err) {
        throw err;
    }
}
async function getCubistConfig(tenantId) {
    try {
        const prisma = await getPrismaClient();
        const cubistConfig = await prisma.cubistconfig.findFirst({
            where: { tenantid: tenantId }
        });
        return cubistConfig;
    }
    catch (err) {
        throw err;
    }
}
async function getMasterSumsubConfig() {
    try {
        const prisma = await getPrismaClient();
        const sumsubConfig = await prisma.sumsubconfig.findFirst({
            where: { ismaster: true }
        });
        return sumsubConfig;
    }
    catch (err) {
        throw err;
    }
}
async function updateTransaction(transactionId, status, callbackStatus) {
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
    }
    catch (err) {
        throw err;
    }
}
async function updateCustomerKycStatus(customerId, status) {
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
    }
    catch (err) {
        throw err;
    }
}
async function deleteCustomer(customerid, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const deletedCustomer = await prisma.customer.delete({
            where: { id: customerid, tenantid: tenantId }
        });
        return deletedCustomer;
    }
    catch (err) {
        throw err;
    }
}
async function deleteWallet(customerid, walletaddress) {
    try {
        const prisma = await getPrismaClient();
        const deletedWallet = await prisma.wallet.findMany({
            where: { customerid: customerid, walletaddress: walletaddress }
        });
        await prisma.wallet.deleteMany({
            where: { customerid: customerid, walletaddress: walletaddress }
        });
        return deletedWallet;
    }
    catch (err) {
        throw err;
    }
}
async function updateCustomerBonusStatus(customerId, status, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const updatedCustomer = await prisma.customer.updateMany({
            where: { id: customerId, tenantid: tenantId },
            data: {
                isbonuscredit: status.toLowerCase() === "true"
            }
        });
        return updatedCustomer;
    }
    catch (err) {
        throw err;
    }
}
async function getStakingTransactionByTenantTransactionId(tenantTransactionId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const stakingTransaction = await prisma.staketransaction.findFirst({
            where: {
                tenantid: tenantId,
                tenanttransactionid: tenantTransactionId
            }
        });
        return stakingTransaction ? stakingTransaction : null;
    }
    catch (err) {
        throw err;
    }
}
async function updateStakeAccountStatus(stakeAccountId, status) {
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
    }
    catch (err) {
        throw err;
    }
}
async function decreaseStakeAmount(stakeAccountId, amount) {
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
    }
    catch (err) {
        throw err;
    }
}
async function updateStakeAccount(stakeAccountId, status, amount) {
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
    }
    catch (err) {
        throw err;
    }
}
async function updateStakeAccountAmount(stakeAccountId, amount) {
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
    }
    catch (err) {
        throw err;
    }
}
async function duplicateStakeAccount(stakeAccountPubKey, newStakeAccountPubKey, newAmount) {
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
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function reduceStakeAccountAmount(stakeAccountPubKey, amountToReduce) {
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
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
async function updateStakingTransaction(transactionId, status, callbackStatus) {
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
    }
    catch (err) {
        throw err;
    }
}
async function getCustomer(tenantUserId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const customer = await prisma.customer.findFirst({
            where: {
                tenantuserid: tenantUserId,
                tenantid: tenantId
            }
        });
        return customer ? customer : null;
    }
    catch (err) {
        return null;
    }
}
async function getAdminUser(tenantUserId, tenantId) {
    try {
        const prisma = await getPrismaClient();
        const customer = await prisma.adminuser.findFirst({
            where: {
                tenantuserid: tenantUserId,
                tenantid: tenantId
            }
        });
        return customer ? customer : null;
    }
    catch (err) {
        return null;
    }
}
async function getStakeAccountPubkeys(walletAddress, tenantId) {
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
    return stakeAccounts.map((stakeAccount) => stakeAccount.stakeaccountpubkey);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJGdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYkZ1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBUUEsMENBU0M7QUFFRCx3Q0FvQkM7QUFFRCwwQ0FvQkM7QUFFRCxnREEyQkM7QUFDRCxvQ0FxREM7QUFFRCw4Q0FzREM7QUFFRCw4Q0E0Q0M7QUFFRCw0REFnREM7QUFDRCxnREEyQ0M7QUFFRCw4Q0FxQkM7QUFFRCxvREFtQ0M7QUFFRCxnREFZQztBQUVELGtGQW1FQztBQUVELDhEQXlDQztBQUVELDRDQWNDO0FBQ0Qsd0RBY0M7QUFFRCwwQ0FlQztBQUNELDREQWNDO0FBRUQsd0NBYUM7QUFFRCxrREErQkM7QUFFRCxzREErQkM7QUFFRCxvREFxQkM7QUFFRCx3Q0FjQztBQUNELHdEQWVDO0FBRUQsa0ZBY0M7QUFFRCxzRkFjQztBQUVELGtEQWNDO0FBRUQsNEVBNkJDO0FBRUQsNEZBcUJDO0FBRUQsOEJBVUM7QUFFRCw0QkFXQztBQUVELDRDQVdDO0FBRUQsd0NBSUM7QUFFRCx3RUFvQ0M7QUFFRCwwREFVQztBQUVELHdFQW9CQztBQUVELG9EQWNDO0FBRUQsZ0RBWUM7QUFFRCxvRUFxQkM7QUFFRCwwRUFlQztBQUVELDhEQVlDO0FBRUQsb0RBVUM7QUFFRCwwQ0FVQztBQUVELHNEQVVDO0FBRUQsOENBZUM7QUFFRCwwREFjQztBQUVELHdDQVVDO0FBRUQsb0NBYUM7QUFFRCw4REFhQztBQUVELGdHQWNDO0FBQ0QsNERBY0M7QUFDRCxrREFjQztBQUNELGdEQWVDO0FBRUQsNERBY0M7QUFFRCxzREFzQ0M7QUFDRCw0REFnQkM7QUFDRCw0REFlQztBQUNELGtDQWFDO0FBRUQsb0NBYUM7QUFFRCx3REFhQztBQXJ6Q0QsMkNBQThDO0FBQzlDLHFDQUFnRjtBQUNoRixnRUFBa0Q7QUFDbEQseUNBQTRDO0FBQzVDLDBDQUE4QztBQUU5QyxJQUFJLFlBQTBCLENBQUM7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LENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNwQyxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztBQUNILENBQUM7QUFFTSxLQUFLLFVBQVUsc0JBQXNCLENBQUMsYUFBcUIsRUFBRSxRQUFnQjtJQUNsRixNQUFNLE1BQU0sR0FBRyxNQUFNLGVBQWUsRUFBRSxDQUFDO0lBQ3ZDLE1BQU0sYUFBYSxHQUFHLE1BQU0sTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUM7UUFDdkQsS0FBSyxFQUFFO1lBQ0wsYUFBYSxFQUFFLGFBQWE7WUFDNUIsUUFBUSxFQUFFLFFBQVE7U0FDbkI7UUFDRCxNQUFNLEVBQUU7WUFDTixrQkFBa0IsRUFBRSxJQUFJO1NBQ3pCO0tBQ0YsQ0FBQyxDQUFDO0lBRUgsT0FBTyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsWUFBaUIsRUFBRSxFQUFFLENBQUMsWUFBWSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDbkYsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuaW1wb3J0IHsgQ2FsbGJhY2tTdGF0dXMsIGN1c3RvbWVyLCBTdGFrZUFjY291bnRTdGF0dXMsIHRlbmFudCB9IGZyb20gXCIuL21vZGVsc1wiO1xuaW1wb3J0ICogYXMgY3MgZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgZ2V0RGF0YWJhc2VVcmwgfSBmcm9tIFwiLi9QZ0NsaWVudFwiO1xuaW1wb3J0IHsgbG9nV2l0aFRyYWNlIH0gZnJvbSBcIi4uL3V0aWxzL3V0aWxzXCI7XG5cbmxldCBwcmlzbWFDbGllbnQ6IFByaXNtYUNsaWVudDtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFByaXNtYUNsaWVudCgpIHtcbiAgaWYgKHByaXNtYUNsaWVudCkge1xuICAgIHJldHVybiBwcmlzbWFDbGllbnQ7XG4gIH1cbiAgY29uc3QgZGF0YWJhc2VVcmwgPSBhd2FpdCBnZXREYXRhYmFzZVVybCgpO1xuICBwcmlzbWFDbGllbnQgPSBuZXcgUHJpc21hQ2xpZW50KHtcbiAgICBkYXRhc291cmNlVXJsOiBkYXRhYmFzZVVybFxuICB9KTtcbiAgcmV0dXJuIHByaXNtYUNsaWVudDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbWVyKGN1c3RvbWVyOiBjdXN0b21lcikge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IG5ld0N1c3RvbWVyID0gYXdhaXQgcHJpc21hLmN1c3RvbWVyLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIHRlbmFudHVzZXJpZDogY3VzdG9tZXIudGVuYW50dXNlcmlkLFxuICAgICAgICB0ZW5hbnRpZDogY3VzdG9tZXIudGVuYW50aWQgYXMgc3RyaW5nLFxuICAgICAgICBlbWFpbGlkOiBjdXN0b21lci5lbWFpbGlkLFxuICAgICAgICBuYW1lOiBjdXN0b21lci5uYW1lLFxuICAgICAgICBpc3M6IGN1c3RvbWVyLmlzcyxcbiAgICAgICAgY3ViaXN0dXNlcmlkOiBjdXN0b21lci5jdWJpc3R1c2VyaWQudG9TdHJpbmcoKSxcbiAgICAgICAgaXNib251c2NyZWRpdDogY3VzdG9tZXIuaXNCb251c0NyZWRpdCxcbiAgICAgICAgaXNhY3RpdmU6IGN1c3RvbWVyLmlzYWN0aXZlLFxuICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3Q3VzdG9tZXI7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQWRtaW5Vc2VyKGN1c3RvbWVyOiBjdXN0b21lcikge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IG5ld0N1c3RvbWVyID0gYXdhaXQgcHJpc21hLmFkbWludXNlci5jcmVhdGUoe1xuICAgICAgZGF0YToge1xuICAgICAgICB0ZW5hbnR1c2VyaWQ6IGN1c3RvbWVyLnRlbmFudHVzZXJpZCxcbiAgICAgICAgdGVuYW50aWQ6IGN1c3RvbWVyLnRlbmFudGlkIGFzIHN0cmluZyxcbiAgICAgICAgZW1haWxpZDogY3VzdG9tZXIuZW1haWxpZCxcbiAgICAgICAgbmFtZTogY3VzdG9tZXIubmFtZSxcbiAgICAgICAgaXNzOiBjdXN0b21lci5pc3MsXG4gICAgICAgIGN1YmlzdHVzZXJpZDogY3VzdG9tZXIuY3ViaXN0dXNlcmlkLnRvU3RyaW5nKCksXG4gICAgICAgIGlzYm9udXNjcmVkaXQ6IGN1c3RvbWVyLmlzQm9udXNDcmVkaXQsXG4gICAgICAgIGlzYWN0aXZlOiBjdXN0b21lci5pc2FjdGl2ZSxcbiAgICAgICAgY3JlYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ld0N1c3RvbWVyO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVdhbGxldEFuZEtleShvcmc6IGFueSwgY3ViaXN0VXNlcklkOiBzdHJpbmcsIGNoYWluVHlwZTogc3RyaW5nLCBjdXN0b21lcklkPzogc3RyaW5nLCBrZXk/OiBhbnkpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIHdhbGxldFwiLCBjdWJpc3RVc2VySWQsIGN1c3RvbWVySWQsIGtleSk7XG4gICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICBrZXkgPSBhd2FpdCBvcmcuY3JlYXRlS2V5KGNzLkVkMjU1MTkuU29sYW5hLCBjdWJpc3RVc2VySWQpO1xuICAgIH1cblxuICAgIGxvZ1dpdGhUcmFjZShcIkNyZWF0ZWQga2V5XCIsIGtleS5tYXRlcmlhbElkKTtcbiAgICBjb25zdCBuZXdXYWxsZXQgPSBhd2FpdCBwcmlzbWEud2FsbGV0LmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIGN1c3RvbWVyaWQ6IGN1c3RvbWVySWQgYXMgc3RyaW5nLFxuICAgICAgICB3YWxsZXRhZGRyZXNzOiBrZXkubWF0ZXJpYWxJZCxcbiAgICAgICAgd2FsbGV0aWQ6IGtleS5pZCxcbiAgICAgICAgY2hhaW50eXBlOiBjaGFpblR5cGUsXG4gICAgICAgIHdhbGxldHR5cGU6IGNzLkVkMjU1MTkuU29sYW5hLnRvU3RyaW5nKCksXG4gICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coXCJDcmVhdGVkIHdhbGxldFwiLCBuZXdXYWxsZXQpO1xuXG4gICAgcmV0dXJuIHsgZGF0YTogbmV3V2FsbGV0LCBlcnJvcjogbnVsbCB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVXYWxsZXQob3JnOiBjcy5PcmcsIGN1YmlzdFVzZXJJZDogc3RyaW5nLCBjaGFpblR5cGU6IHN0cmluZywgY3VzdG9tZXJJZD86IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgd2FsbGV0XCIsIGN1YmlzdFVzZXJJZCwgY2hhaW5UeXBlKTtcbiAgICB2YXIga2V5VHlwZTogYW55O1xuICAgIHN3aXRjaCAoY2hhaW5UeXBlKSB7XG4gICAgICBjYXNlIFwiRXRoZXJldW1cIjpcbiAgICAgICAga2V5VHlwZSA9IGNzLlNlY3AyNTZrMS5Fdm07XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkJpdGNvaW5cIjpcbiAgICAgICAga2V5VHlwZSA9IGNzLlNlY3AyNTZrMS5CdGM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkF2YWxhbmNoZVwiOlxuICAgICAgICBrZXlUeXBlID0gY3MuU2VjcDI1NmsxLkF2YVRlc3Q7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcIkNhcmRhbm9cIjpcbiAgICAgICAga2V5VHlwZSA9IGNzLkVkMjU1MTkuQ2FyZGFubztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiU29sYW5hXCI6XG4gICAgICAgIGtleVR5cGUgPSBjcy5FZDI1NTE5LlNvbGFuYTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiU3RlbGxhclwiOlxuICAgICAgICBrZXlUeXBlID0gY3MuRWQyNTUxOS5TdGVsbGFyO1xuICAgICAgICBicmVhaztcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGtleVR5cGUgPSBudWxsO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIHdhbGxldFwiLCBrZXlUeXBlKTtcbiAgICBpZiAoa2V5VHlwZSAhPSBudWxsKSB7XG4gICAgICBjb25zdCBrZXkgPSBhd2FpdCBvcmcuY3JlYXRlS2V5KGtleVR5cGUsIGN1YmlzdFVzZXJJZCk7XG5cbiAgICAgIC8vIGlmIChrZXlUeXBlID09IGNzLkVkMjU1MTkuU29sYW5hKSB7XG4gICAgICAvLyAgIGNvbnN0IHJvbGUgPSBhd2FpdCBvcmcuZ2V0Um9sZShPUEVSQVRJT05fUk9MRV9JRCk7XG4gICAgICAvLyAgIHJvbGUuYWRkS2V5KGtleSk7XG4gICAgICAvLyB9XG4gICAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICAgIGNvbnN0IG5ld1dhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuY3JlYXRlKHtcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGN1c3RvbWVyaWQ6IGN1c3RvbWVySWQgYXMgc3RyaW5nLFxuICAgICAgICAgIHdhbGxldGFkZHJlc3M6IGtleS5tYXRlcmlhbElkLFxuICAgICAgICAgIHdhbGxldGlkOiBrZXkuaWQsXG4gICAgICAgICAgY2hhaW50eXBlOiBjaGFpblR5cGUsXG4gICAgICAgICAgd2FsbGV0dHlwZToga2V5VHlwZS50b1N0cmluZygpLFxuICAgICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICAgIGNyZWF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgZGF0YTogbmV3V2FsbGV0LCBlcnJvcjogbnVsbCB9O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4geyBkYXRhOiBudWxsLCBlcnJvcjogXCJDaGFpbiB0eXBlIG5vdCBzdXBwb3J0ZWQgZm9yIGtleSBnZW5lcmF0aW9uXCIgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQWRtaW5XYWxsZXQob3JnOiBjcy5PcmcsIGN1YmlzdFVzZXJJZDogc3RyaW5nLCBjaGFpblR5cGU6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZyxjdXN0b21lcklkPzogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coXCJDcmVhdGluZyB3YWxsZXRcIiwgY3ViaXN0VXNlcklkLCBjaGFpblR5cGUpO1xuICAgIHZhciBrZXlUeXBlOiBhbnk7XG4gICAgc3dpdGNoIChjaGFpblR5cGUpIHtcbiAgICAgIGNhc2UgXCJFdGhlcmV1bVwiOlxuICAgICAgICBrZXlUeXBlID0gY3MuU2VjcDI1NmsxLkV2bTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQml0Y29pblwiOlxuICAgICAgICBrZXlUeXBlID0gY3MuU2VjcDI1NmsxLkJ0YztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQXZhbGFuY2hlXCI6XG4gICAgICAgIGtleVR5cGUgPSBjcy5TZWNwMjU2azEuQXZhVGVzdDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiQ2FyZGFub1wiOlxuICAgICAgICBrZXlUeXBlID0gY3MuRWQyNTUxOS5DYXJkYW5vO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJTb2xhbmFcIjpcbiAgICAgICAga2V5VHlwZSA9IGNzLkVkMjU1MTkuU29sYW5hO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJTdGVsbGFyXCI6XG4gICAgICAgIGtleVR5cGUgPSBjcy5FZDI1NTE5LlN0ZWxsYXI7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAga2V5VHlwZSA9IG51bGw7XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRpbmcgd2FsbGV0XCIsIGtleVR5cGUpO1xuICAgIGlmIChrZXlUeXBlICE9IG51bGwpIHtcbiAgICAgIGNvbnN0IGtleSA9IGF3YWl0IG9yZy5jcmVhdGVLZXkoa2V5VHlwZSwgY3ViaXN0VXNlcklkKTtcblxuICAgICAgLy8gaWYgKGtleVR5cGUgPT0gY3MuRWQyNTUxOS5Tb2xhbmEpIHtcbiAgICAgIC8vICAgY29uc3Qgcm9sZSA9IGF3YWl0IG9yZy5nZXRSb2xlKE9QRVJBVElPTl9ST0xFX0lEKTtcbiAgICAgIC8vICAgcm9sZS5hZGRLZXkoa2V5KTtcbiAgICAgIC8vIH1cbiAgICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgICAgY29uc3QgbmV3V2FsbGV0ID0gYXdhaXQgcHJpc21hLmFkbWlud2FsbGV0LmNyZWF0ZSh7XG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBhZG1pbnVzZXJpZDogY3VzdG9tZXJJZCBhcyBzdHJpbmcsXG4gICAgICAgICAgd2FsbGV0YWRkcmVzczoga2V5Lm1hdGVyaWFsSWQsXG4gICAgICAgICAgd2FsbGV0aWQ6IGtleS5pZCxcbiAgICAgICAgICBjaGFpbnR5cGU6IGNoYWluVHlwZSxcbiAgICAgICAgICB3YWxsZXR0eXBlOiBrZXlUeXBlLnRvU3RyaW5nKCksXG4gICAgICAgICAgaXNhY3RpdmU6IHRydWUsXG4gICAgICAgICAgY3JlYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgICAgdGVuYW50aWQ6dGVuYW50SWRcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4geyBkYXRhOiBuZXdXYWxsZXQsIGVycm9yOiBudWxsIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7IGRhdGE6IG51bGwsIGVycm9yOiBcIkNoYWluIHR5cGUgbm90IHN1cHBvcnRlZCBmb3Iga2V5IGdlbmVyYXRpb25cIiB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNlcnRUcmFuc2FjdGlvbihcbiAgc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLFxuICByZWNlaXZlcldhbGxldGFkZHJlc3M6IHN0cmluZyxcbiAgYW1vdW50OiBudW1iZXIsXG4gIGNoYWluVHlwZTogc3RyaW5nLFxuICBzeW1ib2w6IHN0cmluZyxcbiAgdHhoYXNoOiBzdHJpbmcsXG4gIHRlbmFudElkOiBzdHJpbmcsXG4gIGN1c3RvbWVySWQ6IHN0cmluZyxcbiAgdG9rZW5JZDogc3RyaW5nLFxuICB0ZW5hbnRVc2VySWQ6IHN0cmluZyxcbiAgbmV0d29yazogc3RyaW5nLFxuICBzdGF0dXM6IHN0cmluZyxcbiAgdGVuYW50VHJhbnNhY3Rpb25JZDogc3RyaW5nLFxuICBlcnJvcj86IHN0cmluZ1xuKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgbmV3VHJhbnNhY3Rpb24gPSBhd2FpdCBwcmlzbWEudHJhbnNhY3Rpb24uY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogY3VzdG9tZXJJZCxcbiAgICAgICAgY2FsbGJhY2tzdGF0dXM6IENhbGxiYWNrU3RhdHVzLlBFTkRJTkcsXG4gICAgICAgIHRva2VuaWQ6IHRva2VuSWQsXG4gICAgICAgIHRlbmFudHRyYW5zYWN0aW9uaWQ6IHRlbmFudFRyYW5zYWN0aW9uSWQsXG4gICAgICAgIG5ldHdvcms6IG5ldHdvcmssXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICBlcnJvcjogZXJyb3IgYXMgc3RyaW5nLFxuICAgICAgICB0ZW5hbnR1c2VyaWQ6IHRlbmFudFVzZXJJZCxcbiAgICAgICAgd2FsbGV0YWRkcmVzczogc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgcmVjZWl2ZXJ3YWxsZXRhZGRyZXNzOiByZWNlaXZlcldhbGxldGFkZHJlc3MsXG4gICAgICAgIGNoYWludHlwZTogY2hhaW5UeXBlLFxuICAgICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgICAgIHR4aGFzaDogdHhoYXNoLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWQsXG4gICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdXBkYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi5uZXdUcmFuc2FjdGlvbiwgdHJhbnNhY3Rpb25pZDogbmV3VHJhbnNhY3Rpb24uaWQgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNlcnRTdGFraW5nVHJhbnNhY3Rpb24oXG4gIHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgcmVjZWl2ZXJXYWxsZXRhZGRyZXNzOiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBjaGFpblR5cGU6IHN0cmluZyxcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIHR4aGFzaDogc3RyaW5nLFxuICB0ZW5hbnRJZDogc3RyaW5nLFxuICBjdXN0b21lcklkOiBzdHJpbmcsXG4gIHRva2VuSWQ6IHN0cmluZyxcbiAgdGVuYW50VXNlcklkOiBzdHJpbmcsXG4gIG5ldHdvcms6IHN0cmluZyxcbiAgc3RhdHVzOiBzdHJpbmcsXG4gIHRlbmFudFRyYW5zYWN0aW9uSWQ6IHN0cmluZyxcbiAgc3Rha2VhY2NvdW50cHVia2V5OiBzdHJpbmcsXG4gIHN0YWtlYWNjb3VudGlkOiBzdHJpbmcsXG4gIHN0YWtlVHlwZTogc3RyaW5nLFxuICBlcnJvcj86IHN0cmluZ1xuKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgbmV3U3Rha2V0cmFuc2FjdGlvbiA9IGF3YWl0IHByaXNtYS5zdGFrZXRyYW5zYWN0aW9uLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIGN1c3RvbWVyaWQ6IGN1c3RvbWVySWQsXG4gICAgICAgIHR5cGU6IHN0YWtlVHlwZSxcbiAgICAgICAgdG9rZW5pZDogdG9rZW5JZCxcbiAgICAgICAgdGVuYW50dHJhbnNhY3Rpb25pZDogdGVuYW50VHJhbnNhY3Rpb25JZCxcbiAgICAgICAgc3Rha2VhY2NvdW50cHVia2V5OiBzdGFrZWFjY291bnRwdWJrZXksXG4gICAgICAgIG5ldHdvcms6IG5ldHdvcmssXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICBlcnJvcjogZXJyb3IgYXMgc3RyaW5nLFxuICAgICAgICB0ZW5hbnR1c2VyaWQ6IHRlbmFudFVzZXJJZCxcbiAgICAgICAgd2FsbGV0YWRkcmVzczogc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgcmVjZWl2ZXJ3YWxsZXRhZGRyZXNzOiByZWNlaXZlcldhbGxldGFkZHJlc3MsXG4gICAgICAgIGNoYWludHlwZTogY2hhaW5UeXBlLFxuICAgICAgICBhbW91bnQ6IGFtb3VudCxcbiAgICAgICAgc3ltYm9sOiBzeW1ib2wsXG4gICAgICAgIHR4aGFzaDogdHhoYXNoLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWQsXG4gICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICBzdGFrZWFjY291bnRpZDogc3Rha2VhY2NvdW50aWQsXG4gICAgICAgIGNyZWF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgLi4ubmV3U3Rha2V0cmFuc2FjdGlvbiwgdHJhbnNhY3Rpb25pZDogbmV3U3Rha2V0cmFuc2FjdGlvbi5pZCB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNlcnRTdGFrZUFjY291bnQoXG4gIHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZyxcbiAgcmVjZWl2ZXJXYWxsZXRhZGRyZXNzOiBzdHJpbmcsXG4gIGFtb3VudDogbnVtYmVyLFxuICBjaGFpblR5cGU6IHN0cmluZyxcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIHRlbmFudElkOiBzdHJpbmcsXG4gIGN1c3RvbWVySWQ6IHN0cmluZyxcbiAgdGVuYW50VXNlcklkOiBzdHJpbmcsXG4gIG5ldHdvcms6IHN0cmluZyxcbiAgc3RhdHVzOiBzdHJpbmcsXG4gIHRlbmFudFRyYW5zYWN0aW9uSWQ6IHN0cmluZyxcbiAgc3Rha2VhY2NvdW50cHVia2V5OiBzdHJpbmcsXG4gIGxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXA6IG51bWJlcixcbiAgZXJyb3I/OiBzdHJpbmdcbikge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IG5ld1N0YWtlYWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogY3VzdG9tZXJJZCxcbiAgICAgICAgd2FsbGV0YWRkcmVzczogc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgdmFsaWRhdG9ybm9kZWFkZHJlc3M6IHJlY2VpdmVyV2FsbGV0YWRkcmVzcyxcbiAgICAgICAgYW1vdW50OiBhbW91bnQsXG4gICAgICAgIGNoYWludHlwZTogY2hhaW5UeXBlLFxuICAgICAgICBzeW1ib2w6IHN5bWJvbCxcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkLFxuICAgICAgICB0ZW5hbnR1c2VyaWQ6IHRlbmFudFVzZXJJZCxcbiAgICAgICAgbmV0d29yazogbmV0d29yayxcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgIHRlbmFudHRyYW5zYWN0aW9uaWQ6IHRlbmFudFRyYW5zYWN0aW9uSWQsXG4gICAgICAgIHN0YWtlYWNjb3VudHB1YmtleTogc3Rha2VhY2NvdW50cHVia2V5LFxuICAgICAgICBsb2NrdXBleHBpcmF0aW9udGltZXN0YW1wOiBsb2NrdXBFeHBpcmF0aW9uVGltZXN0YW1wLFxuICAgICAgICBpc2FjdGl2ZTogdHJ1ZSxcbiAgICAgICAgY3JlYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBlcnJvcjogZXJyb3JcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4geyAuLi5uZXdTdGFrZWFjY291bnQsIHN0YWtlYWNjb3VudGlkOiBuZXdTdGFrZWFjY291bnQuaWQgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnNlcnRDdXN0b21lckt5YyhjdXN0b21lckt5YzogYW55LCBreWNUeXBlOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcsIGVycm9yPzogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgbmV3Q3VzdG9tZXJLeWMgPSBhd2FpdCBwcmlzbWEuY3VzdG9tZXJreWMuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogY3VzdG9tZXJLeWMuZXh0ZXJuYWxVc2VySWQsXG4gICAgICAgIGt5Y3R5cGU6IGt5Y1R5cGUsXG4gICAgICAgIHR5cGU6IGN1c3RvbWVyS3ljLnR5cGUsXG4gICAgICAgIGt5Y2lkOiBjdXN0b21lckt5Yy5pZCxcbiAgICAgICAgc3RhdHVzOiBjdXN0b21lckt5Yy5yZXZpZXcucmV2aWV3U3RhdHVzLFxuICAgICAgICBlcnJvcjogZXJyb3IgYXMgc3RyaW5nLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWQsXG4gICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdXBkYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gbmV3Q3VzdG9tZXJLeWM7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gbWVyZ2VEYlN0YWtlQWNjb3VudHMoc291cmNlU3Rha2VBY2NvdW50UHVia2V5OiBzdHJpbmcsIHRhcmdldFN0YWtlQWNjb3VudFB1YmtleTogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgc291cmNlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHN0YWtlYWNjb3VudHB1YmtleTogc291cmNlU3Rha2VBY2NvdW50UHVia2V5IH1cbiAgICB9KTtcblxuICAgIGlmICghc291cmNlQWNjb3VudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU291cmNlIHN0YWtlIGFjY291bnQgbm90IGZvdW5kXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IHRhcmdldEFjY291bnQgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZTogeyBzdGFrZWFjY291bnRwdWJrZXk6IHRhcmdldFN0YWtlQWNjb3VudFB1YmtleSB9XG4gICAgfSk7XG5cbiAgICBpZiAoIXRhcmdldEFjY291bnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRhcmdldCBzdGFrZSBhY2NvdW50IG5vdCBmb3VuZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBuZXdBbW91bnQgPSBzb3VyY2VBY2NvdW50LmFtb3VudCB8fCAwICsgTnVtYmVyKHRhcmdldEFjY291bnQuYW1vdW50IHx8IDApO1xuXG4gICAgY29uc3QgdXBkYXRlZFRhcmdldEFjY291bnQgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LnVwZGF0ZU1hbnkoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiB0YXJnZXRTdGFrZUFjY291bnRQdWJrZXkgfSxcbiAgICAgIGRhdGE6IHsgYW1vdW50OiBuZXdBbW91bnQgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVtb3ZlZFNvdXJjZUFjY291bnQgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LmRlbGV0ZU1hbnkoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiBzb3VyY2VTdGFrZUFjY291bnRQdWJrZXkgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgdXBkYXRlZFRhcmdldEFjY291bnQsIHJlbW92ZWRTb3VyY2VBY2NvdW50IH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZVN0YWtlQWNjb3VudChzdGFrZWFjY291bnRwdWJrZXk6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IGRlbGV0ZWRTdGFrZUFjY291bnQgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LmRlbGV0ZU1hbnkoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiBzdGFrZWFjY291bnRwdWJrZXkgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGRlbGV0ZWRTdGFrZUFjY291bnQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc2VydE1lcmdlU3Rha2VBY2NvdW50c1RyYW5zYWN0aW9uKFxuICBzb3VyY2VTdGFrZUFjY291bnRQdWJrZXk6IHN0cmluZyxcbiAgdGFyZ2V0U3Rha2VBY2NvdW50UHVia2V5OiBzdHJpbmcsXG4gIHR4aGFzaDogc3RyaW5nXG4pIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBzb3VyY2VBY2NvdW50ID0gYXdhaXQgcHJpc21hLnN0YWtlYWNjb3VudC5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiBzb3VyY2VTdGFrZUFjY291bnRQdWJrZXkgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFzb3VyY2VBY2NvdW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTb3VyY2Ugc3Rha2UgYWNjb3VudCBub3QgZm91bmRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgdGFyZ2V0QWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHN0YWtlYWNjb3VudHB1YmtleTogdGFyZ2V0U3Rha2VBY2NvdW50UHVia2V5IH1cbiAgICB9KTtcblxuICAgIGlmICghdGFyZ2V0QWNjb3VudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGFyZ2V0IHN0YWtlIGFjY291bnQgbm90IGZvdW5kXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld0Ftb3VudCA9IHNvdXJjZUFjY291bnQuYW1vdW50IHx8IDAgKyBOdW1iZXIodGFyZ2V0QWNjb3VudC5hbW91bnQgfHwgMCk7XG5cbiAgICBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LnVwZGF0ZU1hbnkoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiBzb3VyY2VTdGFrZUFjY291bnRQdWJrZXkgfSxcbiAgICAgIGRhdGE6IHsgYW1vdW50OiBuZXdBbW91bnQsIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH1cbiAgICB9KTtcblxuICAgIGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQudXBkYXRlTWFueSh7XG4gICAgICB3aGVyZTogeyBzdGFrZWFjY291bnRwdWJrZXk6IHRhcmdldFN0YWtlQWNjb3VudFB1YmtleSB9LFxuICAgICAgZGF0YTogeyBzdGF0dXM6IFN0YWtlQWNjb3VudFN0YXR1cy5NRVJHRUQsIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH1cbiAgICB9KTtcblxuICAgIGNvbnN0IHNvdXJjZVN0YWtlVHJhbnNhY3Rpb24gPSBhd2FpdCBwcmlzbWEuc3Rha2V0cmFuc2FjdGlvbi5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50aWQ6IHNvdXJjZUFjY291bnQuaWQgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVyZ2VUcmFuc2FjdGlvbiA9IGF3YWl0IHByaXNtYS5zdGFrZXRyYW5zYWN0aW9uLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIGN1c3RvbWVyaWQ6IHRhcmdldEFjY291bnQuY3VzdG9tZXJpZCxcbiAgICAgICAgdHlwZTogXCJNRVJHRVwiLFxuICAgICAgICB0b2tlbmlkOiBzb3VyY2VTdGFrZVRyYW5zYWN0aW9uIS50b2tlbmlkLFxuICAgICAgICB0ZW5hbnR0cmFuc2FjdGlvbmlkOiB0YXJnZXRBY2NvdW50LnRlbmFudHRyYW5zYWN0aW9uaWQsXG4gICAgICAgIHN0YWtlYWNjb3VudHB1YmtleTogdGFyZ2V0U3Rha2VBY2NvdW50UHVia2V5LFxuICAgICAgICBuZXR3b3JrOiB0YXJnZXRBY2NvdW50Lm5ldHdvcmssXG4gICAgICAgIHN0YXR1czogXCJTVUNDRVNTXCIsXG4gICAgICAgIHRlbmFudHVzZXJpZDogdGFyZ2V0QWNjb3VudC50ZW5hbnR1c2VyaWQsXG4gICAgICAgIHdhbGxldGFkZHJlc3M6IHRhcmdldEFjY291bnQud2FsbGV0YWRkcmVzcyxcbiAgICAgICAgcmVjZWl2ZXJ3YWxsZXRhZGRyZXNzOiB0YXJnZXRBY2NvdW50LndhbGxldGFkZHJlc3MsXG4gICAgICAgIGNoYWludHlwZTogdGFyZ2V0QWNjb3VudC5jaGFpbnR5cGUsXG4gICAgICAgIGFtb3VudDogbmV3QW1vdW50LFxuICAgICAgICBzeW1ib2w6IHRhcmdldEFjY291bnQuc3ltYm9sLFxuICAgICAgICB0eGhhc2g6IHR4aGFzaCxcbiAgICAgICAgdGVuYW50aWQ6IHRhcmdldEFjY291bnQudGVuYW50aWQsXG4gICAgICAgIGlzYWN0aXZlOiB0cnVlLFxuICAgICAgICBzdGFrZWFjY291bnRpZDogc291cmNlQWNjb3VudC5pZCxcbiAgICAgICAgY3JlYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBtZXJnZVRyYW5zYWN0aW9uO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjcmVhdGVXaXRoZHJhd1RyYW5zYWN0aW9uKHN0YWtlYWNjb3VudHB1YmtleTogc3RyaW5nLCB0eGhhc2g6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHN0YWtlYWNjb3VudHB1YmtleTogc3Rha2VhY2NvdW50cHVia2V5IH1cbiAgICB9KTtcblxuICAgIGlmICghc3Rha2VBY2NvdW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdGFrZSBhY2NvdW50IG5vdCBmb3VuZFwiKTtcbiAgICB9XG5cbiAgICBjb25zdCBzb3VyY2VTdGFrZVRyYW5zYWN0aW9uID0gYXdhaXQgcHJpc21hLnN0YWtldHJhbnNhY3Rpb24uZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7IHN0YWtlYWNjb3VudGlkOiBzdGFrZUFjY291bnQuaWQgfVxuICAgIH0pO1xuXG4gICAgYXdhaXQgcHJpc21hLnN0YWtldHJhbnNhY3Rpb24uY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogc3Rha2VBY2NvdW50LmN1c3RvbWVyaWQsXG4gICAgICAgIHR5cGU6IFwid2l0aGRyYXdcIixcbiAgICAgICAgdG9rZW5pZDogc291cmNlU3Rha2VUcmFuc2FjdGlvbiEudG9rZW5pZCxcbiAgICAgICAgdGVuYW50dHJhbnNhY3Rpb25pZDogc3Rha2VBY2NvdW50LnRlbmFudHRyYW5zYWN0aW9uaWQsXG4gICAgICAgIHN0YWtlYWNjb3VudHB1YmtleTogc3Rha2VhY2NvdW50cHVia2V5LFxuICAgICAgICBzdGFrZWFjY291bnRpZDogc3Rha2VBY2NvdW50LmlkLFxuICAgICAgICBuZXR3b3JrOiBzdGFrZUFjY291bnQubmV0d29yayxcbiAgICAgICAgc3RhdHVzOiBcInBlbmRpbmdcIixcbiAgICAgICAgdGVuYW50dXNlcmlkOiBzdGFrZUFjY291bnQudGVuYW50dXNlcmlkLFxuICAgICAgICB3YWxsZXRhZGRyZXNzOiBzdGFrZUFjY291bnQud2FsbGV0YWRkcmVzcyxcbiAgICAgICAgcmVjZWl2ZXJ3YWxsZXRhZGRyZXNzOiBzdGFrZUFjY291bnQuc3Rha2VhY2NvdW50cHVia2V5LFxuICAgICAgICBjaGFpbnR5cGU6IHN0YWtlQWNjb3VudC5jaGFpbnR5cGUsXG4gICAgICAgIGFtb3VudDogc3Rha2VBY2NvdW50LmFtb3VudCxcbiAgICAgICAgc3ltYm9sOiBzdGFrZUFjY291bnQuc3ltYm9sLFxuICAgICAgICB0eGhhc2g6IHR4aGFzaCxcbiAgICAgICAgdGVuYW50aWQ6IHN0YWtlQWNjb3VudC50ZW5hbnRpZCxcbiAgICAgICAgaXNhY3RpdmU6IHRydWUsXG4gICAgICAgIGNyZWF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN0YWtlQWNjb3VudHMoc2VuZGVyV2FsbGV0QWRkcmVzczogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgc3Rha2VBY2NvdW50cyA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgd2FsbGV0YWRkcmVzczogc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3Rha2VBY2NvdW50cy5sZW5ndGggPiAwID8gc3Rha2VBY2NvdW50cyA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hc3RlclZhbGlkYXRvck5vZGUoY2hhaW5UeXBlOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB2YWxpZGF0b3JOb2RlID0gYXdhaXQgcHJpc21hLnZhbGlkYXRvcm5vZGVzLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBpc21hc3RlcjogdHJ1ZSxcbiAgICAgICAgY2hhaW50eXBlOiBjaGFpblR5cGVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB2YWxpZGF0b3JOb2RlID8gdmFsaWRhdG9yTm9kZSA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3Rha2VBY2NvdW50KHNlbmRlcldhbGxldEFkZHJlc3M6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZywgY3VzdG9tZXJJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgc3Rha2VBY2NvdW50ID0gYXdhaXQgcHJpc21hLnN0YWtlYWNjb3VudC5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgd2FsbGV0YWRkcmVzczogc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgY3VzdG9tZXJpZDogY3VzdG9tZXJJZCxcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3Rha2VBY2NvdW50ID8gc3Rha2VBY2NvdW50IDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Q3VzdG9tZXJLeWNCeVRlbmFudElkKGN1c3RvbWVySWQ6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IGN1c3RvbWVyS3ljID0gYXdhaXQgcHJpc21hLmN1c3RvbWVya3ljLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBjdXN0b21lcmlkOiBjdXN0b21lcklkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWRcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBjdXN0b21lckt5YyA/IGN1c3RvbWVyS3ljIDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRDdXN0b21lckt5YyhjdXN0b21lcklkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBjdXN0b21lckt5YyA9IGF3YWl0IHByaXNtYS5jdXN0b21lcmt5Yy5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogY3VzdG9tZXJJZFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGN1c3RvbWVyS3ljID8gY3VzdG9tZXJLeWMgOiBudWxsO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFdhbGxldEJ5Q3VzdG9tZXIodGVuYW50VXNlcklkOiBzdHJpbmcsIGNoYWludHlwZTogc3RyaW5nLCB0ZW5hbnQ6IHRlbmFudCkge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS5jdXN0b21lci5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgdGVuYW50dXNlcmlkOiB0ZW5hbnRVc2VySWQsXG4gICAgICAgIHRlbmFudGlkOiB0ZW5hbnQuaWRcbiAgICAgIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHdhbGxldHM6IHtcbiAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgY2hhaW50eXBlOiBjaGFpbnR5cGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAod2FsbGV0Py53YWxsZXRzLmxlbmd0aCA9PSAwIHx8IHdhbGxldCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBuZXdXYWxsZXQgPSB7XG4gICAgICB3YWxsZXRhZGRyZXNzOiB3YWxsZXQ/LndhbGxldHNbMF0ud2FsbGV0YWRkcmVzcyxcbiAgICAgIGNyZWF0ZWRhdDogd2FsbGV0Py53YWxsZXRzWzBdLmNyZWF0ZWRhdCxcbiAgICAgIGNoYWludHlwZTogd2FsbGV0Py53YWxsZXRzWzBdLmNoYWludHlwZSxcbiAgICAgIHRlbmFudHVzZXJpZDogd2FsbGV0Py50ZW5hbnR1c2VyaWQsXG4gICAgICB0ZW5hbnRpZDogdGVuYW50LmlkLFxuICAgICAgZW1haWxpZDogd2FsbGV0Py5lbWFpbGlkLFxuICAgICAgY3VzdG9tZXJpZDogd2FsbGV0Py5pZFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3V2FsbGV0ID8gbmV3V2FsbGV0IDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBZG1pbldhbGxldEJ5QWRtaW4odGVuYW50VXNlcklkOiBzdHJpbmcsIGNoYWludHlwZTogc3RyaW5nLCB0ZW5hbnQ6IHRlbmFudCkge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS5hZG1pbnVzZXIuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50VXNlcklkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkXG4gICAgICB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBhZG1pbndhbGxldHM6IHtcbiAgICAgICAgICB3aGVyZToge1xuICAgICAgICAgICAgY2hhaW50eXBlOiBjaGFpbnR5cGVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAod2FsbGV0Py5hZG1pbndhbGxldHMubGVuZ3RoID09IDAgfHwgd2FsbGV0ID09IG51bGwpIHJldHVybiBudWxsO1xuICAgIGNvbnN0IG5ld1dhbGxldCA9IHtcbiAgICAgIHdhbGxldGFkZHJlc3M6IHdhbGxldD8uYWRtaW53YWxsZXRzWzBdLndhbGxldGFkZHJlc3MsXG4gICAgICBjcmVhdGVkYXQ6IHdhbGxldD8uYWRtaW53YWxsZXRzWzBdLmNyZWF0ZWRhdCxcbiAgICAgIGNoYWludHlwZTogd2FsbGV0Py5hZG1pbndhbGxldHNbMF0uY2hhaW50eXBlLFxuICAgICAgdGVuYW50dXNlcmlkOiB3YWxsZXQ/LnRlbmFudHVzZXJpZCxcbiAgICAgIHRlbmFudGlkOiB0ZW5hbnQuaWQsXG4gICAgICBlbWFpbGlkOiB3YWxsZXQ/LmVtYWlsaWQsXG4gICAgICBjdXN0b21lcmlkOiB3YWxsZXQ/LmlkXG4gICAgfTtcblxuICAgIHJldHVybiBuZXdXYWxsZXQgPyBuZXdXYWxsZXQgOiBudWxsO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1c3RvbWVyQW5kV2FsbGV0KHRlbmFudFVzZXJJZDogc3RyaW5nLCBjaGFpbnR5cGU6IHN0cmluZywgdGVuYW50OiB0ZW5hbnQpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBwcmlzbWEuY3VzdG9tZXIuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50VXNlcklkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50LmlkXG4gICAgICB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICB3YWxsZXRzOiB7XG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIGNoYWludHlwZTogY2hhaW50eXBlXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKHdhbGxldCA9PSBudWxsKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gd2FsbGV0ID8gd2FsbGV0IDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRQYXllcldhbGxldChjaGFpbnR5cGU6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHBheWVyV2FsbGV0ID0gYXdhaXQgcHJpc21hLmdhc3BheWVyd2FsbGV0LmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZToge1xuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWQsXG4gICAgICAgIHN5bWJvbDogY2hhaW50eXBlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcGF5ZXJXYWxsZXQgPyBwYXllcldhbGxldCA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hc3RlcldhbGxldEFkZHJlc3MoY2hhaW50eXBlOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcsIHN5bWJvbDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgbWFzdGVyV2FsbGV0ID0gYXdhaXQgcHJpc21hLm1hc3RlcndhbGxldC5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkLFxuICAgICAgICBjaGFpbnR5cGU6IGNoYWludHlwZSxcbiAgICAgICAgc3ltYm9sOiBzeW1ib2xcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBtYXN0ZXJXYWxsZXQgPyBtYXN0ZXJXYWxsZXQgOiBudWxsO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9uQnlUZW5hbnRUcmFuc2FjdGlvbklkKHRlbmFudFRyYW5zYWN0aW9uSWQ6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHRyYW5zYWN0aW9uID0gYXdhaXQgcHJpc21hLnRyYW5zYWN0aW9uLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZToge1xuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWQsXG4gICAgICAgIHRlbmFudHRyYW5zYWN0aW9uaWQ6IHRlbmFudFRyYW5zYWN0aW9uSWRcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB0cmFuc2FjdGlvbiA/IHRyYW5zYWN0aW9uIDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdGFraW5nVHJhbnNhY3Rpb25CeVN0YWtlQWNjb3VudElkKHN0YWtlQWNjb3VudElkOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBzdGFraW5nVHJhbnNhY3Rpb24gPSBhd2FpdCBwcmlzbWEuc3Rha2V0cmFuc2FjdGlvbi5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkLFxuICAgICAgICBzdGFrZWFjY291bnRpZDogc3Rha2VBY2NvdW50SWRcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBzdGFraW5nVHJhbnNhY3Rpb24gPyBzdGFraW5nVHJhbnNhY3Rpb24gOiBudWxsO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN0YWtlQWNjb3VudEJ5SWQoc3Rha2VBY2NvdW50SWQ6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudGlkOiB0ZW5hbnRJZCxcbiAgICAgICAgaWQ6IHN0YWtlQWNjb3VudElkXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gc3Rha2VBY2NvdW50ID8gc3Rha2VBY2NvdW50IDogbnVsbDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXYWxsZXRBbmRUb2tlbkJ5V2FsbGV0QWRkcmVzcyh3YWxsZXRBZGRyZXNzOiBzdHJpbmcsIHRlbmFudDogdGVuYW50LCBzeW1ib2w6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHdhbGxldGFkZHJlc3M6IHdhbGxldEFkZHJlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBsZXQgdG9rZW5zO1xuICAgIGlmIChzeW1ib2wgPT0gbnVsbCB8fCBzeW1ib2wgPT0gXCJcIikge1xuICAgICAgdG9rZW5zID0gYXdhaXQgcHJpc21hLnRva2VuLmZpbmRNYW55KHtcbiAgICAgICAgd2hlcmU6IHsgY2hhaW50eXBlOiB3YWxsZXQ/LmNoYWludHlwZSB8fCBcIlwiIH1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0b2tlbnMgPSBhd2FpdCBwcmlzbWEudG9rZW4uZmluZE1hbnkoe1xuICAgICAgICB3aGVyZTogeyBjaGFpbnR5cGU6IHdhbGxldD8uY2hhaW50eXBlIHx8IFwiXCIsIHN5bWJvbDogc3ltYm9sIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHdhbGxldHNXaXRoQ2hhaW5UeXBlUHJvbWlzZXMgPSB0b2tlbnMubWFwKGFzeW5jICh0OiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuZmluZEZpcnN0KHtcbiAgICAgICAgd2hlcmU6IHsgY2hhaW50eXBlOiB0LmNoYWludHlwZSwgd2FsbGV0YWRkcmVzczogd2FsbGV0QWRkcmVzcyB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7IC4uLnQsIC4uLndhbGxldCwgdG9rZW5uYW1lOiB0Lm5hbWUsIHRva2VuaWQ6IHQuaWQgfTtcbiAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgUHJvbWlzZS5hbGwod2FsbGV0c1dpdGhDaGFpblR5cGVQcm9taXNlcyk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0V2FsbGV0QW5kVG9rZW5CeVdhbGxldEFkZHJlc3NCeVN5bWJvbCh3YWxsZXRBZGRyZXNzOiBzdHJpbmcsIHRlbmFudDogdGVuYW50LCBzeW1ib2w6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHdhbGxldGFkZHJlc3M6IHdhbGxldEFkZHJlc3NcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCB0b2tlbnMgPSBhd2FpdCBwcmlzbWEudG9rZW4uZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgY2hhaW50eXBlOiB3YWxsZXQ/LmNoYWludHlwZSB8fCBcIlwiLCBzeW1ib2w6IHN5bWJvbCB9XG4gICAgfSk7XG4gICAgY29uc3Qgd2FsbGV0c1dpdGhDaGFpblR5cGVQcm9taXNlcyA9IHRva2Vucy5tYXAoYXN5bmMgKHQ6IGFueSkgPT4ge1xuICAgICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgcHJpc21hLndhbGxldC5maW5kRmlyc3Qoe1xuICAgICAgICB3aGVyZTogeyBjaGFpbnR5cGU6IHQuY2hhaW50eXBlLCB3YWxsZXRhZGRyZXNzOiB3YWxsZXRBZGRyZXNzIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgLi4udCwgLi4ud2FsbGV0LCB0b2tlbm5hbWU6IHQubmFtZSwgdG9rZW5pZDogdC5pZCB9O1xuICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbCh3YWxsZXRzV2l0aENoYWluVHlwZVByb21pc2VzKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXYWxsZXQod2FsbGV0QWRkcmVzczogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgcHJpc21hLndhbGxldC5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHsgd2FsbGV0YWRkcmVzczogd2FsbGV0QWRkcmVzcyB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHdhbGxldDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbihzeW1ib2w6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgcHJpc21hLnRva2VuLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZTogeyBzeW1ib2w6IHN5bWJvbCB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9rZW47XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0VG9rZW5CeVN5bWJvbChzeW1ib2w6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgcHJpc21hLnRva2VuLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZTogeyBzeW1ib2w6IHN5bWJvbCB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdG9rZW47XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0Rmlyc3RXYWxsZXQod2FsbGV0QWRkcmVzczogc3RyaW5nLCB0ZW5hbnQ6IHRlbmFudCwgc3ltYm9sOiBzdHJpbmcpIHtcbiAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgZ2V0V2FsbGV0QW5kVG9rZW5CeVdhbGxldEFkZHJlc3Mod2FsbGV0QWRkcmVzcywgdGVuYW50LCBzeW1ib2wpO1xuICBpZiAod2FsbGV0Lmxlbmd0aCA9PSAwKSByZXR1cm4gbnVsbDtcbiAgcmV0dXJuIHdhbGxldFswXTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1c3RvbWVyV2FsbGV0c0J5Q3VzdG9tZXJJZChjdXN0b21lcmlkOiBzdHJpbmcsIHRlbmFudDogdGVuYW50KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICBcbiAgICBjb25zdCBjaGFpblR5cGUgPSBhd2FpdCBwcmlzbWEuY2hhaW50eXBlLmZpbmRNYW55KHtcbiAgICB9KTtcbiAgICB2YXIgbmV3V2FsbGV0PVtdIDtcbiAgICBmb3IgKGNvbnN0IGNoYWluIG9mIGNoYWluVHlwZSl7XG4gICAgLy8gIGNoYWluVHlwZS5mb3JFYWNoKChjaGFpbjogYW55KSA9PiB7XG4gICAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBwcmlzbWEud2FsbGV0LmZpbmRGaXJzdCh7XG4gICAgICAgIHdoZXJlOiB7IGN1c3RvbWVyaWQ6IGN1c3RvbWVyaWQsY2hhaW50eXBlOmNoYWluPy5jaGFpbiB9XG4gICAgICB9KTtcbiAgICAgIGNvbnNvbGUubG9nKHdhbGxldCk7XG5cbiAgICAgIGNvbnN0IHdhbGxldERhdGEgPSB7XG4gICAgICAgIGNoYWludHlwZTogY2hhaW4/LmNoYWluLFxuICAgICAgICB3YWxsZXRhZGRyZXNzOiB3YWxsZXQ/LndhbGxldGFkZHJlc3MsXG4gICAgICAgIHdhbGxldHR5cGU6IHdhbGxldD8ud2FsbGV0dHlwZSxcbiAgICAgICAgc3ltYm9sIDogY2hhaW4/LnN5bWJvbCxcbiAgICAgICAgY3JlYXRlZGF0OiB3YWxsZXQ/LmNyZWF0ZWRhdCxcbiAgICAgICAgY3VzdG9tZXJpZDogd2FsbGV0Py5jdXN0b21lcmlkXG4gICAgICB9XG5jb25zb2xlLmxvZyh3YWxsZXREYXRhKTtcbiAgICAgIFxuICAgIFxuICAgICAgICBuZXdXYWxsZXQucHVzaCh3YWxsZXREYXRhKTtcblxuICAgICAgXG4gICAgXG4gICAgfVxuICAgIHJldHVybiBuZXdXYWxsZXQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxuXG4gXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBDdXN0b21lckFuZFdhbGxldENvdW50cyh0ZW5hbnQ6IHRlbmFudCkge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuY291bnQoe30pO1xuXG4gICAgLy9jb25zdCBjdXN0b21lciA9IGF3YWl0IHByaXNtYS5jdXN0b21lci5jb3VudCh7d2hlcmU6e3RlbmFudGlkOnRlbmFudC5pZH19KTtcbiAgICByZXR1cm4geyB3YWxsZXQgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUcmFuc2FjdGlvbnNCeVdhbGxldEFkZHJlc3Mod2FsbGV0QWRkcmVzczogc3RyaW5nLCB0ZW5hbnQ6IHRlbmFudCwgc3ltYm9sOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBhd2FpdCBwcmlzbWEudHJhbnNhY3Rpb24uZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgd2FsbGV0YWRkcmVzczogd2FsbGV0QWRkcmVzcyxcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudC5pZFxuICAgICAgfVxuICAgIH0pO1xuICAgIGNvbnN0IHRva2VuID0gYXdhaXQgcHJpc21hLnRva2VuLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBzeW1ib2w6IHN5bWJvbFxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0cmFuc2FjdGlvbnMubWFwKCh0OiBhbnkpID0+IHtcbiAgICAgIHJldHVybiB7IC4uLnQsIC4uLih0b2tlbiB8fCB7fSkgfTtcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdGFrZVRyYW5zYWN0aW9ucyhzdGFrZWFjY291bnRpZDogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgc3Rha2VUcmFuc2FjdGlvbnMgPSBhd2FpdCBwcmlzbWEuc3Rha2V0cmFuc2FjdGlvbi5maW5kTWFueSh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBzdGFrZWFjY291bnRpZDogc3Rha2VhY2NvdW50aWQsXG4gICAgICAgIHRlbmFudGlkOiB0ZW5hbnRJZFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN0YWtlVHJhbnNhY3Rpb25zO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFsbFRyYW5zYWN0aW9ucygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBhd2FpdCBwcmlzbWEudHJhbnNhY3Rpb24uZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgc3RhdHVzOiBcIlBFTkRJTkdcIlxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB0cmFuc2FjdGlvbnM7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsQ3VzdG9tZXJXYWxsZXRGb3JCb251cyh0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgd2FsbGV0cyA9IGF3YWl0IHByaXNtYS5jdXN0b21lci5maW5kTWFueSh7XG4gICAgICB3aGVyZToge1xuICAgICAgICBpc2JvbnVzY3JlZGl0OiBmYWxzZSxcbiAgICAgICAgdGVuYW50aWQ6IHRlbmFudElkXG4gICAgICB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICB3YWxsZXRzOiB7XG4gICAgICAgICAgd2hlcmU6IHtcbiAgICAgICAgICAgIGNoYWludHlwZTogXCJTb2xhbmFcIlxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIHRha2U6IDEwXG4gICAgfSk7XG4gICAgcmV0dXJuIHdhbGxldHM7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsQ3VzdG9tZXJBbmRXYWxsZXRCeVRlbmFudCh0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgY3VzdG9tZXJzID0gYXdhaXQgcHJpc21hLmN1c3RvbWVyLmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudGlkOiB0ZW5hbnRJZFxuICAgICAgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgd2FsbGV0czogdHJ1ZVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBjdXN0b21lcnM7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0QWxsU3Rha2luZ1RyYW5zYWN0aW9ucygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBzdGFraW5nVHJhbnNhY3Rpb25zID0gYXdhaXQgcHJpc21hLnN0YWtldHJhbnNhY3Rpb24uZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgc3RhdHVzOiBcIlBFTkRJTkdcIlxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBzdGFraW5nVHJhbnNhY3Rpb25zO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFRlbmFudENhbGxCYWNrVXJsKHRlbmFudElkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB0ZW5hbnQgPSBhd2FpdCBwcmlzbWEudGVuYW50LmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHRlbmFudElkIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdGVuYW50O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1YmlzdENvbmZpZyh0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgY3ViaXN0Q29uZmlnID0gYXdhaXQgcHJpc21hLmN1YmlzdGNvbmZpZy5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHsgdGVuYW50aWQ6IHRlbmFudElkIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3ViaXN0Q29uZmlnO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1hc3RlclN1bXN1YkNvbmZpZygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBzdW1zdWJDb25maWcgPSBhd2FpdCBwcmlzbWEuc3Vtc3ViY29uZmlnLmZpbmRGaXJzdCh7XG4gICAgICB3aGVyZTogeyBpc21hc3RlcjogdHJ1ZSB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHN1bXN1YkNvbmZpZztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVUcmFuc2FjdGlvbih0cmFuc2FjdGlvbklkOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBjYWxsYmFja1N0YXR1czogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgdXBkYXRlZFRyYW5zYWN0aW9uID0gYXdhaXQgcHJpc21hLnRyYW5zYWN0aW9uLnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogdHJhbnNhY3Rpb25JZCB9LFxuICAgICAgZGF0YToge1xuICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgY2FsbGJhY2tzdGF0dXM6IGNhbGxiYWNrU3RhdHVzLFxuICAgICAgICB1cGRhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB1cGRhdGVkVHJhbnNhY3Rpb247XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlQ3VzdG9tZXJLeWNTdGF0dXMoY3VzdG9tZXJJZDogc3RyaW5nLCBzdGF0dXM6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHVwZGF0ZWRDdXN0b21lckt5YyA9IGF3YWl0IHByaXNtYS5jdXN0b21lcmt5Yy51cGRhdGVNYW55KHtcbiAgICAgIHdoZXJlOiB7IGN1c3RvbWVyaWQ6IGN1c3RvbWVySWQgfSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVwZGF0ZWRDdXN0b21lckt5YztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWxldGVDdXN0b21lcihjdXN0b21lcmlkOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBkZWxldGVkQ3VzdG9tZXIgPSBhd2FpdCBwcmlzbWEuY3VzdG9tZXIuZGVsZXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBjdXN0b21lcmlkLCB0ZW5hbnRpZDogdGVuYW50SWQgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWxldGVkQ3VzdG9tZXI7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVsZXRlV2FsbGV0KGN1c3RvbWVyaWQ6IHN0cmluZywgd2FsbGV0YWRkcmVzczogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgZGVsZXRlZFdhbGxldCA9IGF3YWl0IHByaXNtYS53YWxsZXQuZmluZE1hbnkoe1xuICAgICAgd2hlcmU6IHsgY3VzdG9tZXJpZDogY3VzdG9tZXJpZCwgd2FsbGV0YWRkcmVzczogd2FsbGV0YWRkcmVzcyB9XG4gICAgfSk7XG4gICAgYXdhaXQgcHJpc21hLndhbGxldC5kZWxldGVNYW55KHtcbiAgICAgIHdoZXJlOiB7IGN1c3RvbWVyaWQ6IGN1c3RvbWVyaWQsIHdhbGxldGFkZHJlc3M6IHdhbGxldGFkZHJlc3MgfVxuICAgIH0pO1xuICAgIHJldHVybiBkZWxldGVkV2FsbGV0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUN1c3RvbWVyQm9udXNTdGF0dXMoY3VzdG9tZXJJZDogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHVwZGF0ZWRDdXN0b21lciA9IGF3YWl0IHByaXNtYS5jdXN0b21lci51cGRhdGVNYW55KHtcbiAgICAgIHdoZXJlOiB7IGlkOiBjdXN0b21lcklkLCB0ZW5hbnRpZDogdGVuYW50SWQgfSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgaXNib251c2NyZWRpdDogc3RhdHVzLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVwZGF0ZWRDdXN0b21lcjtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdGFraW5nVHJhbnNhY3Rpb25CeVRlbmFudFRyYW5zYWN0aW9uSWQodGVuYW50VHJhbnNhY3Rpb25JZDogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3Qgc3Rha2luZ1RyYW5zYWN0aW9uID0gYXdhaXQgcHJpc21hLnN0YWtldHJhbnNhY3Rpb24uZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudGlkOiB0ZW5hbnRJZCxcbiAgICAgICAgdGVuYW50dHJhbnNhY3Rpb25pZDogdGVuYW50VHJhbnNhY3Rpb25JZFxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHN0YWtpbmdUcmFuc2FjdGlvbiA/IHN0YWtpbmdUcmFuc2FjdGlvbiA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVN0YWtlQWNjb3VudFN0YXR1cyhzdGFrZUFjY291bnRJZDogc3RyaW5nLCBzdGF0dXM6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHVwZGF0ZWRTdGFrZUFjY291bnQgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogc3Rha2VBY2NvdW50SWQgfSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVwZGF0ZWRTdGFrZUFjY291bnQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlY3JlYXNlU3Rha2VBbW91bnQoc3Rha2VBY2NvdW50SWQ6IHN0cmluZywgYW1vdW50OiBudW1iZXIpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCB1cGRhdGVkU3Rha2VBY2NvdW50ID0gYXdhaXQgcHJpc21hLnN0YWtlYWNjb3VudC51cGRhdGUoe1xuICAgICAgd2hlcmU6IHsgaWQ6IHN0YWtlQWNjb3VudElkIH0sXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGFtb3VudDogeyBkZWNyZW1lbnQ6IGFtb3VudCB9LFxuICAgICAgICB1cGRhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB1cGRhdGVkU3Rha2VBY2NvdW50O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVTdGFrZUFjY291bnQoc3Rha2VBY2NvdW50SWQ6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGFtb3VudDogbnVtYmVyKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgdXBkYXRlZFN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBzdGFrZUFjY291bnRJZCB9LFxuICAgICAgZGF0YToge1xuICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgYW1vdW50OiB7IGRlY3JlbWVudDogYW1vdW50IH0sXG4gICAgICAgIHVwZGF0ZWRhdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHVwZGF0ZWRTdGFrZUFjY291bnQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlU3Rha2VBY2NvdW50QW1vdW50KHN0YWtlQWNjb3VudElkOiBzdHJpbmcsIGFtb3VudDogbnVtYmVyKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgdXBkYXRlZFN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQudXBkYXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkOiBzdGFrZUFjY291bnRJZCB9LFxuICAgICAgZGF0YToge1xuICAgICAgICBhbW91bnQ6IHsgaW5jcmVtZW50OiBhbW91bnQgfSxcbiAgICAgICAgdXBkYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gdXBkYXRlZFN0YWtlQWNjb3VudDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkdXBsaWNhdGVTdGFrZUFjY291bnQoc3Rha2VBY2NvdW50UHViS2V5OiBzdHJpbmcsIG5ld1N0YWtlQWNjb3VudFB1YktleTogc3RyaW5nLCBuZXdBbW91bnQ6IG51bWJlcikge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IGV4aXN0aW5nU3Rha2VBY2NvdW50ID0gYXdhaXQgcHJpc21hLnN0YWtlYWNjb3VudC5maW5kRmlyc3Qoe1xuICAgICAgd2hlcmU6IHsgc3Rha2VhY2NvdW50cHVia2V5OiBzdGFrZUFjY291bnRQdWJLZXkgfVxuICAgIH0pO1xuXG4gICAgaWYgKCFleGlzdGluZ1N0YWtlQWNjb3VudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3Rha2UgYWNjb3VudCBub3QgZm91bmRcIik7XG4gICAgfVxuXG4gICAgY29uc3QgZHVwbGljYXRlZFN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQuY3JlYXRlKHtcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgY3VzdG9tZXJpZDogZXhpc3RpbmdTdGFrZUFjY291bnQuY3VzdG9tZXJpZCxcbiAgICAgICAgbG9ja3VwZXhwaXJhdGlvbnRpbWVzdGFtcDogZXhpc3RpbmdTdGFrZUFjY291bnQubG9ja3VwZXhwaXJhdGlvbnRpbWVzdGFtcCxcbiAgICAgICAgdGVuYW50dHJhbnNhY3Rpb25pZDogZXhpc3RpbmdTdGFrZUFjY291bnQudGVuYW50dHJhbnNhY3Rpb25pZCxcbiAgICAgICAgc3Rha2VhY2NvdW50cHVia2V5OiBuZXdTdGFrZUFjY291bnRQdWJLZXksXG4gICAgICAgIG5ldHdvcms6IGV4aXN0aW5nU3Rha2VBY2NvdW50Lm5ldHdvcmssXG4gICAgICAgIHN0YXR1czogZXhpc3RpbmdTdGFrZUFjY291bnQuc3RhdHVzLFxuICAgICAgICBlcnJvcjogZXhpc3RpbmdTdGFrZUFjY291bnQuZXJyb3IsXG4gICAgICAgIHRlbmFudHVzZXJpZDogZXhpc3RpbmdTdGFrZUFjY291bnQudGVuYW50dXNlcmlkLFxuICAgICAgICB3YWxsZXRhZGRyZXNzOiBleGlzdGluZ1N0YWtlQWNjb3VudC53YWxsZXRhZGRyZXNzLFxuICAgICAgICB2YWxpZGF0b3Jub2RlYWRkcmVzczogZXhpc3RpbmdTdGFrZUFjY291bnQudmFsaWRhdG9ybm9kZWFkZHJlc3MsXG4gICAgICAgIGNoYWludHlwZTogZXhpc3RpbmdTdGFrZUFjY291bnQuY2hhaW50eXBlLFxuICAgICAgICBhbW91bnQ6IG5ld0Ftb3VudCxcbiAgICAgICAgc3ltYm9sOiBleGlzdGluZ1N0YWtlQWNjb3VudC5zeW1ib2wsXG4gICAgICAgIHRlbmFudGlkOiBleGlzdGluZ1N0YWtlQWNjb3VudC50ZW5hbnRpZCxcbiAgICAgICAgaXNhY3RpdmU6IGV4aXN0aW5nU3Rha2VBY2NvdW50LmlzYWN0aXZlLFxuICAgICAgICBjcmVhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdXBkYXRlZGF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBkdXBsaWNhdGVkU3Rha2VBY2NvdW50O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVkdWNlU3Rha2VBY2NvdW50QW1vdW50KHN0YWtlQWNjb3VudFB1YktleTogc3RyaW5nLCBhbW91bnRUb1JlZHVjZTogbnVtYmVyKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgdXBkYXRlZFN0YWtlQWNjb3VudCA9IGF3YWl0IHByaXNtYS5zdGFrZWFjY291bnQudXBkYXRlTWFueSh7XG4gICAgICB3aGVyZTogeyBzdGFrZWFjY291bnRwdWJrZXk6IHN0YWtlQWNjb3VudFB1YktleSB9LFxuICAgICAgZGF0YToge1xuICAgICAgICBhbW91bnQ6IHsgZGVjcmVtZW50OiBhbW91bnRUb1JlZHVjZSB9LFxuICAgICAgICB1cGRhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVwZGF0ZWRTdGFrZUFjY291bnQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB1cGRhdGVTdGFraW5nVHJhbnNhY3Rpb24odHJhbnNhY3Rpb25JZDogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgY2FsbGJhY2tTdGF0dXM6IHN0cmluZykge1xuICB0cnkge1xuICAgIGNvbnN0IHByaXNtYSA9IGF3YWl0IGdldFByaXNtYUNsaWVudCgpO1xuICAgIGNvbnN0IHVwZGF0ZWRUcmFuc2FjdGlvbiA9IGF3YWl0IHByaXNtYS5zdGFrZXRyYW5zYWN0aW9uLnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZDogdHJhbnNhY3Rpb25JZCB9LFxuICAgICAgZGF0YToge1xuICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgY2FsbGJhY2tzdGF0dXM6IGNhbGxiYWNrU3RhdHVzLFxuICAgICAgICB1cGRhdGVkYXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB1cGRhdGVkVHJhbnNhY3Rpb247XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1c3RvbWVyKHRlbmFudFVzZXJJZDogc3RyaW5nLCB0ZW5hbnRJZDogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gICAgY29uc3QgY3VzdG9tZXIgPSBhd2FpdCBwcmlzbWEuY3VzdG9tZXIuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50VXNlcklkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWRcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3VzdG9tZXIgPyBjdXN0b21lciA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRBZG1pblVzZXIodGVuYW50VXNlcklkOiBzdHJpbmcsIHRlbmFudElkOiBzdHJpbmcpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBwcmlzbWEgPSBhd2FpdCBnZXRQcmlzbWFDbGllbnQoKTtcbiAgICBjb25zdCBjdXN0b21lciA9IGF3YWl0IHByaXNtYS5hZG1pbnVzZXIuZmluZEZpcnN0KHtcbiAgICAgIHdoZXJlOiB7XG4gICAgICAgIHRlbmFudHVzZXJpZDogdGVuYW50VXNlcklkLFxuICAgICAgICB0ZW5hbnRpZDogdGVuYW50SWRcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY3VzdG9tZXIgPyBjdXN0b21lciA6IG51bGw7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdGFrZUFjY291bnRQdWJrZXlzKHdhbGxldEFkZHJlc3M6IHN0cmluZywgdGVuYW50SWQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3QgcHJpc21hID0gYXdhaXQgZ2V0UHJpc21hQ2xpZW50KCk7XG4gIGNvbnN0IHN0YWtlQWNjb3VudHMgPSBhd2FpdCBwcmlzbWEuc3Rha2VhY2NvdW50LmZpbmRNYW55KHtcbiAgICB3aGVyZToge1xuICAgICAgd2FsbGV0YWRkcmVzczogd2FsbGV0QWRkcmVzcyxcbiAgICAgIHRlbmFudGlkOiB0ZW5hbnRJZFxuICAgIH0sXG4gICAgc2VsZWN0OiB7XG4gICAgICBzdGFrZWFjY291bnRwdWJrZXk6IHRydWVcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBzdGFrZUFjY291bnRzLm1hcCgoc3Rha2VBY2NvdW50OiBhbnkpID0+IHN0YWtlQWNjb3VudC5zdGFrZWFjY291bnRwdWJrZXkpO1xufVxuIl19