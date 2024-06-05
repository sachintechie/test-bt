import { executeQuery } from "./PgClient";
import { customer, tenant, token, wallet } from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";

export async function createCustomer(customer: customer) {
  try {
    console.log("Creating customer", customer);
    let query = `INSERT INTO customer (tenantuserid, tenantid, emailid,name,cubistuserid,isactive)
      VALUES ('${customer.tenantuserid}','${customer.tenantid}', '${
        customer.emailid
      }','${customer.name}','${customer.cubistuserid.toString()}',${customer.isactive})RETURNING id; `;
    console.log("Query", query);
    const res = await executeQuery(query);
    console.log("customer created Res", res);
    const customerRow = res.rows[0];
    console.log("Customer Row", customerRow);
    return customerRow.id;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function createWallet(org: any, cubistUserId: string, customerId: string, chainType: string) {
  try {
    console.log("Creating wallet", cubistUserId, customerId);
    // Create a key for the OIDC user
    const key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
    // console.log("Created key", key.PublicKey.toString());
    let query = `INSERT INTO wallet (customerid, walletaddress,walletid,chaintype,wallettype,isactive)
      VALUES ('${customerId}','${key.materialId}','${
        key.id
      }','${chainType}','${cs.Ed25519.Solana.toString()}',true) RETURNING customerid,walletaddress,chaintype,createdat; `;
    console.log("Query", query);
    const res = await executeQuery(query);
    console.log("wallet created Res", res);

    const walletRow = res.rows[0];
    console.log("wallet Row", walletRow);

    return walletRow;
  } catch (err) {
    console.log(err);
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
  network:string,
  status : string,
  tenantTransactionId: string,
  error?: string
) {
  try {
    console.log("creating transaction", receiverWalletaddress, customerId);
    let query = `INSERT INTO transaction (customerid,tokenid,tenanttransactionid,network,status,error,tenantuserid, walletaddress,receiverWalletaddress,chaintype,amount,symbol,txhash,tenantid,isactive)
      VALUES ('${customerId}','${tokenId}','${tenantTransactionId}', '${network}','${status}','${error}','${tenantUserId}','${senderWalletAddress}','${receiverWalletaddress}','${chainType}',${amount},'${symbol}','${txhash}','${tenantId}',true) RETURNING 
      customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid; `;
    console.log("Query", query);
    const res = await executeQuery(query);
    console.log("transaction created Res", res);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
export async function getWalletByCustomer(tenantUserId: string, chaintype: string, tenant: tenant) {
  try {
    let query = `select customerid,walletaddress,wallet.chaintype,tenantid,tenantuserid,wallet.createdat,customer.emailid from customer  INNER JOIN wallet 
      ON  wallet.customerid = customer.id where customer.tenantuserid =  '${tenantUserId}' AND wallet.chaintype ='${chaintype}' AND customer.tenantid = '${tenant.id}';`;
    console.log("Query", query);
    const res = await executeQuery(query);

    const walletRow = res.rows[0];
    console.log("Wallet Row", walletRow);
    return walletRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getPayerWallet(chaintype: string, tenantId: string) {
  try {
    let query = `select * from GasPayerWallet where tenantid =  '${tenantId}' AND symbol ='${chaintype}';`;
    console.log("Query", query);
    const res = await executeQuery(query);

    const walletRow = res.rows[0];
    console.log("Wallet Row", walletRow);
    return walletRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getMasterWalletAddress(chaintype: string, tenantId: string,symbol : string) {
  try {
    let query = `select * from masterwallet where tenantid =  '${tenantId}' AND chaintype ='${chaintype}' AND symbol='${symbol}';`;
    console.log("Query", query);
    const res = await executeQuery(query);

    const masterWalletRow = res.rows[0];
    console.log("Wallet Row", masterWalletRow);
    return masterWalletRow;
  } catch (err) {
    console.log(err);
    throw err;
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
    const res = await executeQuery(query);
    const walletRow = res.rows;
    return walletRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getTransactionsByWalletAddress(walletAddress: string, tenant: tenant, symbol: string) {
  try {
    console.log("Wallet Address", walletAddress, symbol);
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
    console.log(err);
    throw err;
  }
}

export async function getAllTransactions() {
  try {
    let query = `select * from transaction where status = 'PENDING';`;
    const res = await executeQuery(query);
    const transactionRow = res.rows;
    return transactionRow;
  } catch (err) {
    console.log(err);
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
    console.log(err);
    throw err;
  }
}

export async function updateTransaction(transactionId: string, status: string) {
  try {
    let query = `update transaction set status = '${status}' , updatedat= CURRENT_TIMESTAMP  where id = '${transactionId}' RETURNING   customerid,walletaddress,receiverwalletaddress,chaintype,txhash,symbol,amount,createdat,tenantid,tokenid,network,tenantuserid,status,id as transactionid,tenanttransactionid;`;
   
    const res = await executeQuery(query);
    const transactionRow = res.rows[0];
    return transactionRow;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

export async function getCustomer(tenantUserId: string, tenantId: string) {
  try {
    console.log("Tenant User Id", tenantUserId, tenantId);
    let query = `SELECT * FROM customer WHERE tenantuserid = '${tenantUserId}' AND tenantid = '${tenantId}';`;
    console.log("Query", query);
    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return to_customer(customerRow);
  } catch (err) {
    console.log(err);
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
    console.log(err);
    // return null;
    throw err;
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
