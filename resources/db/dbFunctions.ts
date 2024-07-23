import { executeQuery } from "./PgClient";
import { CallbackStatus, customer, StakeAccountStatus, tenant, token, wallet } from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";

export async function createCustomer(customer: customer) {
  try {
    // // console.log("Creating customer", customer);
    let query = `INSERT INTO customer (tenantuserid, tenantid, emailid,name,cubistuserid,isbonuscredit,isactive)
      VALUES ('${customer.tenantuserid}','${customer.tenantid}', '${customer.emailid}','${
        customer.name
      }','${customer.cubistuserid.toString()}', '${customer.isBonusCredit}',${customer.isactive})RETURNING id; `;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("customer created Res", res);
    const customerRow = res.rows[0];
    // console.log("Customer Row", customerRow);
    return customerRow.id;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function createWalletAndKey(org: any, cubistUserId: string, chainType: string, customerId?: string, key?: any) {
  try {
    console.log("Creating wallet", cubistUserId, customerId, key);
    // Create a key for the OIDC user
    if (key == null) {
      key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
    }

    //  console.log("Created key", key.PublicKey.toString());
    let query = `INSERT INTO wallet (customerid, walletaddress,walletid,chaintype,wallettype,isactive)
      VALUES ('${customerId}','${key.materialId}','${
        key.id
      }','${chainType}','${cs.Ed25519.Solana.toString()}',true) RETURNING customerid,walletaddress,chaintype,createdat; `;
    console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("wallet created Res", res);

    const walletRow = res.rows[0];
    // console.log("wallet Row", walletRow);

    return walletRow;
  } catch (err) {
    // console.log(err);
    //return null;
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
      // case "BTCTEST":
      //     keyType = cs.Secp256k1.BtcTest
      //     break;
      // case "AVAX":
      //     keyType = cs.Secp256k1.Ava
      //     break;
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
      // case "APT":
      //     keyType = cs.Ed25519.Aptos
      //     break;
      // case "SUI":
      //     keyType = cs.Ed25519.Sui
      //     break;
      default:
        keyType = null;
    }
    console.log("Creating wallet", keyType);
    if (keyType != null) {
      let key;
      if (keyType == cs.Ed25519.Solana) { 
        key  = await org.createKey(keyType, cubistUserId);
        const role = await org.createRole();
        await role.addUser("User#7df2fa4c-f1ab-436e-b649-c0c601b4bee3"); //ops user cubist-user-id
        role.addKey(key)
      }
      key  = await org.createKey(keyType, cubistUserId);


      let query = `INSERT INTO wallet (customerid, walletaddress,walletid,chaintype,wallettype,isactive)
      VALUES ('${customerId}','${key.materialId}','${
        key.id
      }','${chainType}','${keyType.toString()}',true) RETURNING customerid,walletaddress,chaintype,createdat; `;
      console.log("Query", query);
      const res = await executeQuery(query);
      // console.log("wallet created Res", res);

      const walletRow = res.rows[0];
      // console.log("wallet Row", walletRow);

      return { data: walletRow, error: null };

     
    } else {
      return { data: null, error: "Chain type not supported for key generation" };
    }
  } catch (err) {
    // console.log(err);
    //return null;
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
    // console.log("creating transaction", receiverWalletaddress, customerId);
    let query = `INSERT INTO transaction (customerid,callbackstatus,tokenid,tenanttransactionid,network,status,error,tenantuserid, walletaddress,receiverWalletaddress,chaintype,amount,symbol,txhash,tenantid,isactive)
      VALUES ('${customerId}','${CallbackStatus.PENDING}','${tokenId}','${tenantTransactionId}', '${network}','${status}','${error}','${tenantUserId}','${senderWalletAddress}','${receiverWalletaddress}','${chainType}',${amount},'${symbol}','${txhash}','${tenantId}',true) RETURNING 
      customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid; `;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("transaction created Res", res);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
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
    // console.log("creating transaction", receiverWalletaddress, customerId);
    let query = `INSERT INTO staketransaction (customerid,type,tokenid,tenanttransactionid,stakeaccountpubkey,network,status,error,tenantuserid, walletaddress,receiverWalletaddress,chaintype,amount,symbol,txhash,tenantid,isactive,stakeaccountid)
      VALUES ('${customerId}','${stakeType}','${tokenId}','${tenantTransactionId}','${stakeaccountpubkey}', '${network}','${status}','${error}','${tenantUserId}','${senderWalletAddress}','${receiverWalletaddress}','${chainType}',${amount},'${symbol}','${txhash}','${tenantId}',true,'${stakeaccountid}') RETURNING 
      customerid,walletaddress,receiverwalletaddress,chaintype,txhash,type,symbol,amount,createdat,tokenid,network,tenantuserid,status,stakeaccountid,id as transactionid,tenanttransactionid; `;
    console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("stake transaction created Res", res);
    const stakeTransactionRow = res.rows[0];
    return stakeTransactionRow;
  } catch (err) {
    // console.log(err);
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
    // console.log("creating stakeaccount ", receiverWalletaddress, customerId);
    let query = `INSERT INTO stakeaccount (customerid,lockupExpirationTimestamp,tenanttransactionid,stakeaccountpubkey,network,status,error,tenantuserid, walletaddress,validatornodeaddress,chaintype,amount,symbol,tenantid,isactive)
      VALUES ('${customerId}','${lockupExpirationTimestamp}','${tenantTransactionId}','${stakeaccountpubkey}', '${network}','${status}','${error}','${tenantUserId}','${senderWalletAddress}','${receiverWalletaddress}','${chainType}',${amount},'${symbol}','${tenantId}',true) RETURNING 
      customerid,walletaddress,validatornodeaddress,chaintype,symbol,amount,createdat,network,tenantuserid,status,id as stakeaccountid,tenanttransactionid; `;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("stake transaction created Res", res);
    const stakeTransactionRow = res.rows[0];
    return stakeTransactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function insertCustomerKyc(
  customerKyc: any,
  kycType: string,
  tenantId: string,
  error?: string
) {
  try {
    let query = `INSERT INTO customerkyc (customerid,kyctype,type,kycid,status,error, tenantid)
      VALUES ('${customerKyc.externalUserId}','${kycType}','${customerKyc.type}','${customerKyc.id}', '${customerKyc.review.reviewStatus}','${error}','${tenantId}') RETURNING 
      id,customerid,type,kycType,kycid,status,tenantid; `;
     console.log("Query", query);
    const res = await executeQuery(query);
    const customerKycRow = res.rows[0];
    return customerKycRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}




export async function mergeDbStakeAccounts(
  sourceStakeAccountPubkey: string,
  targetStakeAccountPubkey: string,
) {
  try {
    // Query to get details of source and target stake accounts
    const sourceQuery = `SELECT * FROM stakeaccount WHERE stakeaccountpubkey = '${sourceStakeAccountPubkey}' LIMIT 1;`;
    const targetQuery = `SELECT * FROM stakeaccount WHERE stakeaccountpubkey = '${targetStakeAccountPubkey}' LIMIT 1;`;

    const sourceRes = await executeQuery(sourceQuery);
    const targetRes = await executeQuery(targetQuery);

    if (sourceRes.rows.length === 0) {
      throw new Error('Source stake account not found');
    }

    if (targetRes.rows.length === 0) {
      throw new Error('Target stake account not found');
    }

    const sourceAccount = sourceRes.rows[0];
    const targetAccount = targetRes.rows[0];

    // Calculate the new amount for the target account
    const newAmount = sourceAccount.amount + targetAccount.amount;

    // Update the target account with the new amount
    const updateTargetQuery = `
      UPDATE stakeaccount
      SET amount = ${newAmount}
      WHERE stakeaccountpubkey = '${targetStakeAccountPubkey}'
      RETURNING *;
    `;
    const updateTargetRes = await executeQuery(updateTargetQuery);

    if (updateTargetRes.rows.length === 0) {
      throw new Error('Failed to update target stake account');
    }

    // Remove the source account
    const deleteSourceQuery = `
      DELETE FROM stakeaccount
      WHERE stakeaccountpubkey = '${sourceStakeAccountPubkey}'
      RETURNING customerid, walletaddress, validatornodeaddress, chaintype, symbol, amount, createdat, network, tenantuserid, status, id as stakeaccountid, tenanttransactionid;
    `;
    const deleteSourceRes = await executeQuery(deleteSourceQuery);

    if (deleteSourceRes.rows.length === 0) {
      throw new Error('Failed to delete source stake account');
    }

    // Return the updated target account and details of the removed source account
    return {
      updatedTargetAccount: updateTargetRes.rows[0],
      removedSourceAccount: deleteSourceRes.rows[0]
    };
  } catch (err) {
    console.error(err);
    throw err;
  }
}


export async function removeStakeAccount(stakeaccountpubkey: string) {
  try {
    const query = `
      DELETE FROM stakeaccount
      WHERE stakeaccountpubkey = '${stakeaccountpubkey}'
      RETURNING customerid, walletaddress, validatornodeaddress, chaintype, symbol, amount, createdat, network, tenantuserid, status, id as stakeaccountid, tenanttransactionid;
    `;

    console.log("Query", query);
    const res = await executeQuery(query);

    if (res.rows.length === 0) {
      throw new Error('Stake account not found or could not be deleted');
    }

    const deletedStakeAccountRow = res.rows[0];
    return deletedStakeAccountRow;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function insertMergeStakeAccountsTransaction(
  sourceStakeAccountPubkey: string,
  targetStakeAccountPubkey: string,
  txhash: string,
) {
  try {
    // Query to get details of source and target stake accounts
    const sourceQuery = `SELECT * FROM stakeaccount WHERE stakeaccountpubkey = '${sourceStakeAccountPubkey}' LIMIT 1;`;
    const targetQuery = `SELECT * FROM stakeaccount WHERE stakeaccountpubkey = '${targetStakeAccountPubkey}' LIMIT 1;`;

    const sourceRes = await executeQuery(sourceQuery);
    const targetRes = await executeQuery(targetQuery);

    if (sourceRes.rows.length === 0) {
      throw new Error('Source stake account not found');
    }

    if (targetRes.rows.length === 0) {
      throw new Error('Target stake account not found');
    }

    const sourceAccount = sourceRes.rows[0];
    const targetAccount = targetRes.rows[0];

    // Calculate the new amount
    const newAmount = sourceAccount.amount + targetAccount.amount;

    const updateSourceAccountQuery= `update stakeaccount set amount = '${newAmount}',updatedat= CURRENT_TIMESTAMP where stakeaccountpubkey = '${sourceStakeAccountPubkey}';`;
    const updateTargetAccountQuery= `update stakeaccount set status = '${StakeAccountStatus.MERGED}' ,updatedat= CURRENT_TIMESTAMP where stakeaccountpubkey = '${targetStakeAccountPubkey}';`;
    const updatedSourceAccount = await executeQuery(updateSourceAccountQuery);
    const updatedTargetAccount = await executeQuery(updateTargetAccountQuery);
    console.log("updatedSourceAccount",updatedSourceAccount,"updatedTargetAccount",updatedTargetAccount);

    // Insert merge transaction into staketransaction table
    const insertQuery = `
      INSERT INTO staketransaction (
        customerid, type, tokenid, tenanttransactionid, stakeaccountpubkey, network, status, error, tenantuserid,
        walletaddress, receiverwalletaddress, chaintype, amount, symbol, txhash, tenantid, isactive,stakeaccountid
      ) VALUES (
        '${targetAccount.customerid}', 'MERGE', '${targetAccount.tokenid}', '${targetAccount.tenanttransactionid}', 
        '${targetStakeAccountPubkey}', '${targetAccount.network}', 'SUCCESS', '', '${targetAccount.tenantuserid}',
        '${targetAccount.walletaddress}', '${targetAccount.walletaddress}', '${targetAccount.chaintype}', ${newAmount}, 
        '${targetAccount.symbol}', '${txhash}', '${targetAccount.tenantid}', true, '${sourceAccount.id}'
      ) RETURNING 
        customerid, walletaddress, receiverwalletaddress, chaintype, txhash, type, symbol, amount, createdat, tokenid,
        network, tenantuserid, status, stakeaccountid, id as transactionid, tenanttransactionid;
    `;

    console.log("Insert Query", insertQuery);
    const insertRes = await executeQuery(insertQuery);
    const mergeTransactionRow = insertRes.rows[0];
    return mergeTransactionRow;
  } catch (err) {
    console.error(err);
    throw err;
  }
}


export async function createWithdrawTransaction(stakeaccountpubkey: string,txhash:string) {
  try {
    // Query to get the required fields from stakeaccount using stakeaccountpubkey
    let query = `
      SELECT customerid, walletaddress AS senderWalletAddress, receiverWalletAddress, amount, chaintype, symbol, tenantid, tenantuserid, network, tenanttransactionid, id AS stakeaccountid
      FROM stakeaccount
      WHERE stakeaccountpubkey = '${stakeaccountpubkey}'
      LIMIT 1;
    `;

    const stakeAccountRes = await executeQuery(query);
    if (stakeAccountRes.rows.length === 0) {
      throw new Error('Stake account not found');
    }

    const stakeAccount = stakeAccountRes.rows[0];

    const insertQuery = `
      INSERT INTO staketransaction (
        customerid, type, tokenid, tenanttransactionid, stakeaccountpubkey, network, status, error, tenantuserid,
        walletaddress, receiverwalletaddress, chaintype, amount, symbol, txhash, tenantid, isactive
      ) VALUES (
        '${stakeAccount.customerid}', 'withdraw', 'tokenId_placeholder', '${stakeAccount.tenanttransactionid}', '${stakeaccountpubkey}', '${stakeAccount.network}',
        'pending', NULL, '${stakeAccount.tenantuserid}', '${stakeAccount.senderWalletAddress}', '${stakeAccount.receiverwalletaddress}', '${stakeAccount.chaintype}',
        ${stakeAccount.amount}, '${stakeAccount.symbol}', '${txhash}', '${stakeAccount.tenantid}', true
      ) RETURNING 
        customerid, walletaddress, receiverwalletaddress, chaintype, txhash, type, symbol, amount, createdat, tokenid,
        network, tenantuserid, status, id as transactionid, tenanttransactionid;
    `;

    console.log("Insert Query", insertQuery);
    const insertRes = await executeQuery(insertQuery);
    const stakeTransactionRow = insertRes.rows[0];
    return stakeTransactionRow;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getStakeAccounts(senderWalletAddress: string, tenantId: string) {
  try {
    // console.log("Fetching stake account public key for", senderWalletAddress, customerId);
    let query = `SELECT * FROM stakeaccount
      WHERE walletaddress = '${senderWalletAddress}' AND tenantId = '${tenantId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("Stake account public key fetch result", res);

    if (res.rows.length > 0) {
      return res.rows;
    } else {
      return null;
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getMasterValidatorNode(chainType: string) {
  try {
    let query = `SELECT * FROM validatornodes
      WHERE ismaster = 'true' and chaintype='${chainType}' limit 1 ;`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("Stake account public key fetch result", res);

    if (res.rows.length > 0) {
      return res.rows[0]; 
    } else {
      return null;
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getStakeAccount(senderWalletAddress: string, tenantId: string, customerId: string) {
  try {
    // console.log("Fetching stake account public key for", senderWalletAddress, customerId);
    let query = `SELECT * FROM stakeaccount
      WHERE walletaddress = '${senderWalletAddress}' AND customerId = '${customerId}' AND tenantId = '${tenantId}' LIMIT 1;`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("Stake account public key fetch result", res);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function getCustomerKycByTenantId(customerId: string, tenantId: string) {
  try {
    let query = `SELECT * FROM customerkyc
      WHERE customerid = '${customerId}' AND tenantId = '${tenantId}' LIMIT 1;`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("Stake account public key fetch result", res);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getCustomerKyc(customerId: string) {
  try {
    let query = `SELECT * FROM customerkyc
      WHERE customerid = '${customerId}' LIMIT 1;`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    // console.log("Stake account public key fetch result", res);

    if (res.rows.length > 0) {
      return res.rows[0];
    } else {
      return null;
    }
  } catch (err) {
    // console.log(err);
    throw err;
  }
}



export async function getWalletByCustomer(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    let query = `select customerid,walletaddress,wallet.chaintype,tenantid,tenantuserid,wallet.createdat,customer.emailid from customer  INNER JOIN wallet 
      ON  wallet.customerid = customer.id where customer.tenantuserid =  '${tenantUserId}' AND wallet.chaintype ='${chaintype}' AND customer.tenantid = '${tenant.id}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const walletRow = res.rows[0];
    // console.log("Wallet Row", walletRow);
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getPayerWallet(chaintype: string, tenantId: string) {
  try {
    let query = `select * from GasPayerWallet where tenantid =  '${tenantId}' AND symbol ='${chaintype}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const walletRow = res.rows[0];
    // console.log("Wallet Row", walletRow);
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getMasterWalletAddress(chaintype: string, tenantId: string, symbol: string) {
  try {
    let query = `select * from masterwallet where tenantid =  '${tenantId}' AND chaintype ='${chaintype}' AND symbol='${symbol}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const masterWalletRow = res.rows[0];
    // console.log("Wallet Row", masterWalletRow);
    return masterWalletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getTransactionByTenantTransactionId(tenantTransactionId: string, tenantId: string) {
  try {
    let query = `select * from transaction where tenantid =  '${tenantId}' AND tenanttransactionid ='${tenantTransactionId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const transactionRow = res.rows[0];
    // console.log("transactionRow", transactionRow);
    return transactionRow;
  } catch (err) {
    // console.log(err);
    return null;
  }
}

export async function getStakingTransactionByStakeAccountId(stakeAccountId: string, tenantId: string) {
  try {
    let query = `select * from staketransaction where tenantid =  '${tenantId}' AND stakeaccountid ='${stakeAccountId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const transactionRow = res.rows[0];
    // console.log("transactionRow", transactionRow);
    return transactionRow;
  } catch (err) {
    // console.log(err);
    return null;
  }
}

export async function getStakeAccountById(stakeAccountId: string, tenantId: string) {
  try {
    let query = `select * from stakeaccount where tenantid =  '${tenantId}' AND id ='${stakeAccountId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const transactionRow = res.rows[0];
    // console.log("transactionRow", transactionRow);
    return transactionRow;
  } catch (err) {
    // console.log(err);
    return null;
  }
}

export async function getWalletAndTokenByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    console.log("Wallet Address", walletAddress, symbol);
    let query;
    if (symbol != null && symbol != "") {
      query = `select wallet.walletaddress,token.name as tokenname,token.decimalprecision,token.id as tokenid,token.symbol,token.contractaddress,token.chaintype,wallet.customerid,wallet.createdat from wallet  INNER JOIN token 
    ON  wallet.chaintype = token.chaintype where wallet.walletaddress = '${walletAddress}' AND token.symbol = '${symbol}';`;
    } else {
      query = `select wallet.walletaddress,token.name as tokenname,token.decimalprecision,token.id as tokenid,token.symbol,token.contractaddress,token.chaintype,wallet.customerid,wallet.createdat from wallet  INNER JOIN token 
      ON  wallet.chaintype = token.chaintype where wallet.walletaddress = '${walletAddress}';`;
    }
    console.log("Query", query);
    const res = await executeQuery(query);
    const walletRow = res.rows;
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getTokenBySymbol(symbol: string) {
  try {
    console.log("symbol", symbol);
    let query = `select token.name as tokenname,token.decimalprecision,token.id as tokenid,token.symbol,token.contractaddress,token.chaintype from token where token.symbol = '${symbol}';`;

    console.log("Query", query);
    const res = await executeQuery(query);
    const walletRow = res.rows[0];
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function hasWallet(walletAddress: string, tenant: tenant, symbol: string) {
  const wallet = await getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol);
  return wallet.length > 0;
}

export async function getFirstWallet(walletAddress: string, tenant: tenant, symbol: string) {
  const wallet = await getWalletAndTokenByWalletAddress(walletAddress, tenant, symbol);
  if (wallet.length == 0) return null;
  return wallet[0];
}

export async function getCustomerWalletsByCustomerId(customerid: string, tenant: tenant) {
  try {
    // console.log("tenantUserId", tenantUserId);
    let query = `SELECT chaintype.chain as chaintype,w.createdat,w.customerid,w.walletaddress,chaintype.symbol,w.wallettype FROM chaintype LEFT JOIN (SELECT * FROM wallet WHERE wallet.customerid = '${customerid}') as W ON chaintype.chain = w.chaintype;`;
    console.log("Query", query);
    const res = await executeQuery(query);
    const walletRow = res.rows;
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}



export async function getTransactionsByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    // console.log("Wallet Address", walletAddress, symbol);
    let query;
    if (symbol != null && symbol != "") {
      query = `select * from transaction 
    where walletaddress = '${walletAddress}'  AND tenantid = '${tenant.id}' AND symbol = '${symbol}';`;
    } else {
      query = `select * from transaction 
      where walletaddress = '${walletAddress}' AND tenantid = '${tenant.id}';`;
    }
    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getStakeTransactions(stakeaccountid: string, tenantId: string) {
  try {
    console.log("stakeaccountid", stakeaccountid, tenantId);
    let query = `select * from staketransaction where stakeaccountid = '${stakeaccountid}' AND tenantid = '${tenantId}';`;

    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getAllTransactions() {
  try {
    let query = `select customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tenantid,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid from transaction where status = 'PENDING';`;
    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getAllCustomerWalletForBonus(tenantId: string) {
  try {
    let query = `select walletaddress ,customer.id as customerid from customer  INNER JOIN wallet 
    ON  wallet.customerid = customer.id where customer.isBonusCredit is NULL AND wallet.chaintype ='Solana' AND customer.tenantid = '${tenantId}' limit 10;`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getAllCustomerAndWalletByTenant(tenantId: string) {
  try {
    let query = `select walletaddress ,customer.id as customerid , cubistuserid from customer  INNER JOIN wallet 
    ON  wallet.customerid = customer.id where customer.tenantid = '${tenantId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    const customerRow = res.rows;
    
     return customerRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getAllStakingTransactions() {
  try {
    let query = `select customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tenantid,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid from staketransaction where status = 'PENDING';`;
    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getTenantCallBackUrl(tenantId: string) {
  try {
    let query = `select * from tenant where id = '${tenantId}';`;
    const res = await executeQuery(query);
    const tenant = res.rows;
    return tenant[0];
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getCubistConfig(tenantId: string) {
  try {
    let query = `select * from CubistConfig where tenantid = '${tenantId}';`;
    const res = await executeQuery(query);
    const cubist = res.rows;
    return cubist[0];
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function getMasterSumsubConfig() {
  try {
    let query = `select * from SumsubConfig where isMaster = true;`;
    const res = await executeQuery(query);
    const cubist = res.rows;
    return cubist[0];
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function updateTransaction(transactionId: string, status: string, callbackStatus: string) {
  try {
    let query = `update transaction set status = '${status}' ,callbackstatus = '${callbackStatus}', updatedat= CURRENT_TIMESTAMP  where id = '${transactionId}' RETURNING customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tenantid,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid;`;

    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function updateCustomerKycStatus(customerId: string, status: string) {
  try {
    let query = `update customerkyc set status = '${status}' , updatedat= CURRENT_TIMESTAMP  where customerid = '${customerId}' RETURNING customerid,status,id;`;

    const res = await executeQuery(query);
    const customerkyc = res.rows[0];
    return customerkyc;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function deleteCustomer(customerid: string, tenantId: string) {
  try {
    let query = `delete from customer  where id = '${customerid}' AND tenantid='${tenantId}' RETURNING id;`;

    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return customerRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function deleteWallet(customerid: string, walletaddress: string) {
  try {
    let query = `delete from wallet  where customerid = '${customerid}' AND walletaddress='${walletaddress}' RETURNING id;`;

    const res = await executeQuery(query);
    const walletRow = res.rows[0];
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function updateCustomerBonusStatus(customerId: string, status: string, tenantId: string) {
  try {
    let query = `update customer set isBonusCredit = '${status}'   where id = '${customerId}' AND tenantid='${tenantId}' RETURNING id;`;

    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return customerRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function updateWallet(customerId: string, tenantId: string, stakeAccountPubKey: string, chainType: string) {
  try {
    let query = `update wallet set stakeaccountpubkey = '${stakeAccountPubKey}', updatedat= CURRENT_TIMESTAMP  where customerid = '${customerId}' AND teantid='${tenantId}' AND chaintype='${chainType} AND stakeaccountpubkey=null' RETURNING id;`;
    const res = await executeQuery(query);
    const walletRow = res.rows[0];
    return walletRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function getStakingTransactionByTenantTransactionId(tenantTransactionId: string, tenantId: string) {
  try {
    let query = `select * from staketransaction where tenantid =  '${tenantId}' AND tenanttransactionid ='${tenantTransactionId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);

    const transactionRow = res.rows[0];
    // console.log("transactionRow", transactionRow);
    return transactionRow;
  } catch (err) {
    // console.log(err);
    return null;
  }
}
export async function updateStakeAccountStatus(stakeAccountId: string, status: string) {
  try {
    let query = `update stakeaccount set status = '${status}' ,updatedat= CURRENT_TIMESTAMP  where id = '${stakeAccountId}' RETURNING id;`;

    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function decreaseStakeAmount(stakeAccountId: string, amount: number) {
  try {
    let query = `update stakeaccount set  amount = amount - '${amount}' ,updatedat= CURRENT_TIMESTAMP  where id = '${stakeAccountId}' RETURNING id;`;

    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}
export async function updateStakeAccount(stakeAccountId: string, status: string, amount: number) {
  try {
    let query = `update stakeaccount set status = '${status}' , amount = amount - '${amount}' ,updatedat= CURRENT_TIMESTAMP  where id = '${stakeAccountId}' RETURNING id;`;

    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function updateStakeAccountAmount(stakeAccountId: string, amount: number) {
  try {
    let query = `update stakeaccount set amount = amount+'${amount}' ,updatedat= CURRENT_TIMESTAMP  where id = '${stakeAccountId}' RETURNING id;`;
    console.log("Query", query);
    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function updateStakeAccountAmountByStakeAccountPubKey(stakeAccountPubKey: string, amount: number) {
  try {
    let query = `update stakeaccount set amount = amount+'${amount}' ,updatedat= CURRENT_TIMESTAMP  where stakeaccountpubkey = '${stakeAccountPubKey}' RETURNING id;`;
    console.log("Query", query);
    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    throw err;
  }
}

export async function duplicateStakeAccount(
  stakeAccountPubKey: string,
  newStakeAccountPubKey: string,
  newAmount: number
) {
  try {
    // Step 1: Retrieve the existing stake account row
    let selectQuery = `SELECT * FROM stakeaccount WHERE stakeaccountpubkey = '${stakeAccountPubKey}';`;
    const selectRes = await executeQuery(selectQuery);
    if (selectRes.rows.length === 0) {
      throw new Error('Stake account not found');
    }
    const existingStakeAccount = selectRes.rows[0];

    // Step 2: Insert a new row with the new stakeaccountpubkey and amount
    let insertQuery = `INSERT INTO stakeaccount (
      customerid, lockupExpirationTimestamp, tenanttransactionid, stakeaccountpubkey, network, status, error, tenantuserid, walletaddress, validatornodeaddress, chaintype, amount, symbol, tenantid, isactive
    ) VALUES (
      '${existingStakeAccount.customerid}', '${existingStakeAccount.lockupExpirationTimestamp}', '${existingStakeAccount.tenanttransactionid}', '${newStakeAccountPubKey}', '${existingStakeAccount.network}', '${existingStakeAccount.status}', '${existingStakeAccount.error}', '${existingStakeAccount.tenantuserid}', '${existingStakeAccount.walletaddress}', '${existingStakeAccount.validatornodeaddress}', '${existingStakeAccount.chaintype}', ${newAmount}, '${existingStakeAccount.symbol}', '${existingStakeAccount.tenantid}', ${existingStakeAccount.isactive}
    ) RETURNING customerid, walletaddress, validatornodeaddress, chaintype, symbol, amount, createdat, network, tenantuserid, status, id as stakeaccountid, tenanttransactionid;`;

    const insertRes = await executeQuery(insertQuery);
    const duplicatedStakeAccountRow = insertRes.rows[0];
    return duplicatedStakeAccountRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function reduceStakeAccountAmount(
  stakeAccountPubKey: string,
  amountToReduce: number
) {
  try {
    // Fetch the current amount of the stake account
    let selectQuery = `SELECT amount FROM stakeaccount WHERE stakeaccountpubkey = '${stakeAccountPubKey}';`;
    const selectRes = await executeQuery(selectQuery);

    // Check if the stake account exists
    if (selectRes.rows.length === 0) {
      throw new Error('Stake account not found');
    }

    // Get the current amount
    const currentAmount = selectRes.rows[0].amount;

    // Check if the amount to reduce is valid
    if (amountToReduce > currentAmount) {
      throw new Error('Amount to reduce exceeds the current amount');
    }

    // Calculate the new amount
    const newAmount = currentAmount - amountToReduce;

    // Update the amount in the stake account
    let updateQuery = `UPDATE stakeaccount SET amount = ${newAmount} WHERE stakeaccountpubkey = '${stakeAccountPubKey}' RETURNING 
      customerid, walletaddress, validatornodeaddress, chaintype, symbol, amount, createdat, network, tenantuserid, status, id as stakeaccountid, tenanttransactionid;`;
    const updateRes = await executeQuery(updateQuery);

    // Return the updated stake account row
    const updatedStakeAccountRow = updateRes.rows[0];
    return updatedStakeAccountRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function updateStakingTransaction(transactionId: string, status: string, callbackStatus: string) {
  try {
    let query = `update staketransaction set status = '${status}' ,callbackstatus = '${callbackStatus}', updatedat= CURRENT_TIMESTAMP  where id = '${transactionId}' RETURNING customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tenantid,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid;`;

    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    // console.log(err);
    throw err;
  }
}

export async function getCustomer(tenantUserId: string, tenantId: string) {
  try {
    // console.log("Tenant User Id", tenantUserId, tenantId);
    let query = `SELECT * FROM customer WHERE tenantuserid = '${tenantUserId}' AND tenantid = '${tenantId}';`;
    // console.log("Query", query);
    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return to_customer(customerRow);
  } catch (err) {
    // console.log(err);
    // throw err;
    return null;
  }
}

export async function getTokens(chainType: string) {
  try {
    let query = `SELECT * FROM customer WHERE chaintype = '${chainType}';`;
    const res = await executeQuery(query);
    const tokenRow = res.rows[0];
    return to_token(tokenRow);
  } catch (err) {
    // console.log(err);
    // return null;
    throw err;
  }
}

export async function getStakeAccountPubkeys(walletAddress: string, tenantId: string): Promise<string[]> {
  const query = `
        SELECT stakeaccountpubkey
        FROM stakeaccount
        WHERE walletaddress = '${walletAddress}' AND tenantId = '${tenantId}';
    `;

  console.log("Query", query);
  const res = await executeQuery(query) ;
  console.log("Stake account public key fetch result", res);

  return res.rows.map((row: { stakeaccountpubkey: string }) => row.stakeaccountpubkey);
}

// Function to get walletid from walletaddress
export async function getWalletIdFromAddress(walletAddress: string): Promise<string | null> {
  const query = `
        SELECT walletid
        FROM wallet
        WHERE walletaddress = '${walletAddress}' LIMIT 1;
    `;

  console.log("Query", query);
  const res = await executeQuery(query);
  console.log("Wallet ID fetch result", res);

  if (res.rows.length > 0) {
    return res.rows[0].walletid;
  } else {
    return null;
  }
}


const to_wallet = (itemRow: wallet): wallet => {
  return {
    id: itemRow.id,
    customerid: itemRow.customerid,
    walletaddress: itemRow.walletaddress,
    symbol: itemRow.symbol,
    walletid: itemRow.walletid,
    isactive: itemRow.isactive,
    createdat: itemRow.createdat,
    chaintype: itemRow.chaintype,
    wallettype: itemRow.wallettype
  };
};
const to_wallet_token = (itemRow: wallet[]): wallet[] => {
  var data = itemRow.map((item) => {
    return {
      id: item.id,
      customerid: item.customerid,
      walletaddress: item.walletaddress,
      symbol: item.symbol,
      walletid: item.walletid,
      isactive: item.isactive,
      createdat: item.createdat,
      chaintype: item.chaintype,
      wallettype: item.wallettype,
      decimalprecision: item.decimalprecision,
      contractaddress: item.contractaddress
    };
  });
  return data;
};
const to_customer = (itemRow: customer): customer => {
  return {
    id: itemRow.id,
    tenantuserid: itemRow.tenantuserid,
    tenantid: itemRow.tenantid,
    emailid: itemRow.emailid,
    name: itemRow.name,
    cubistuserid: itemRow.cubistuserid,
    isactive: itemRow.isactive,
    isBonusCredit: itemRow.isBonusCredit,
    createdat: itemRow.createdat
  };
};

const to_token = (itemRow: token): token => {
  return {
    id: itemRow.id,
    name: itemRow.name,
    chaintype: itemRow.chaintype,
    symbol: itemRow.symbol,
    contractaddress: itemRow.contractaddress,
    decimalprecision: itemRow.decimalprecision,
    isactive: itemRow.isactive,
    createdat: itemRow.createdat
  };
};
