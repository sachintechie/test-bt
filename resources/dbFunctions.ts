import { executeQuery } from "./PgClient";
import { customer, tenant, token, wallet } from "./models";
import * as cs from "@cubist-labs/cubesigner-sdk";

export async function createCustomer(customer: customer) {
  try {
    let query = `INSERT INTO customer (tenantUserId, tenantId, emailId,name,cubistUserId,isActive,createdat)
      VALUES (${customer}); `;
    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return to_customer(customerRow);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function createWallet(
  org: any,
  cubistUserId: string,
  customer: customer
) {
  try {
    // Create a key for the OIDC user
    const key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
    let query = `INSERT INTO wallet (customerid, walletaddress, symbol,walletid,chaintype,wallettype,isactive,createdat)
      VALUES (${
        (customer.id,
        key.materialId,
        "SOL",
        key.id,
        "Solana",
        key.cached.type,
        true,
        new Date().toISOString())
      }); `;
    const res = await executeQuery(query);
    const walletRow = res.rows[0];
    return to_wallet(walletRow);
  } catch (err) {
    console.error(err);
    throw err;
  }
}
export async function getWalletByCustomer(
  tenantUserId: string,
  symbol: string,
  tenant: tenant
) {
  try {
    let query = `select * from customer  INNER JOIN wallet 
      ON  wallet.customerid = customer.id where customer.tenantUserId =  '${tenantUserId}' AND customer.tenantId = '${tenant.id}';`;
    const res = await executeQuery(query);
    const walletRow = res.rows[0];
    return to_wallet(walletRow);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getWalletAndTokenByWalletAddress(
  walletAddress: string,
  tenant: tenant
) {
  try {
    console.log("Wallet Address", walletAddress);
    let query = `select * from wallet  INNER JOIN token 
    ON  wallet.chaintype = token.chaintype where wallet.walletaddress = '${walletAddress}';`;
    const res = await executeQuery(query);
    const walletRow = res.rows;
    return to_wallet_token(walletRow);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getCustomer(tenantUserId: string, tenantId: number) {
  try {
    let query = `SELECT * FROM customer WHERE tenantUserId = '${tenantUserId}' AND tenantId = '${tenantId}';`;
    const res = await executeQuery(query);
    const customerRow = res.rows[0];
    return to_customer(customerRow);
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function getTokens(chainType: string) {
    try {
      let query = `SELECT * FROM customer WHERE chaintype = '${chainType}';`;
      const res = await executeQuery(query);
      const tokenRow = res.rows[0];
      return to_token(tokenRow);
    } catch (err) {
      console.error(err);
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
    wallettype: itemRow.wallettype,
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
        contractaddress: item.contractaddress,
        

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
    createdat: itemRow.createdat,
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
      createdat: itemRow.createdat,
    };
  };
