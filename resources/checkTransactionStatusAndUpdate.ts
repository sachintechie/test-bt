import { getAllTransactions, getTenantCallBackUrl, updateTransaction } from "./dbFunctions";
import { TransactionStatus, tenant } from "./models";
import { verifySolanaTransaction } from "./solanaTransfer";
import fetch from "node-fetch";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const transactions = await updateTransactions();
    return {
      status: 200,
      data: transactions,
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function updateTransactions() {
  console.log("updateTransactions");

  try {
    let updatedTransactions = [];
    const transactions = await getAllTransactions();
    for (const trx of transactions) {
      if (trx.status === TransactionStatus.PENDING) {
        //console.log(trx, "trx");
        const status = (await verifySolanaTransaction(trx.txhash)) === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
        const updatedTransaction = await updateTransaction(trx.id, status);
        const tenant = await getTenantCallBackUrl(trx.tenantid);
     //   console.log(tenant, "tenant");
        if (tenant != null && tenant.callbackurl != null && tenant.callbackurl != undefined) {
          const tenantUpdate = await updateTenant(tenant, updatedTransaction);
          //call the callback url with the updated transaction status
        }
        updatedTransactions.push(updatedTransaction);
      }
    }
   // console.log(updatedTransactions, "updatedTransactions");
    return updatedTransactions;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateTenant(tenant: any, transaction: any) {
  console.log("updateTenant",tenant, (transaction));
  var data;
  const tenantHeaderKey = tenant.tenantheaderkey;
  const tenantHeaderValue = tenant.tenantsecret;
  const tenantHeader = {
    "Content-Type": "application/json",
    Accept: "*/*",
    [tenantHeaderKey]: tenantHeaderValue
  };
  console.log(tenantHeader);
  
  await fetch(tenant.callbackurl, {
    method: "POST",
    headers: tenantHeader,
    body: (transaction)
  })
    .then(async (response) => {
      console.log(response);
      data = await response.json();
      console.log(data,"response");
    })
    .catch((error) => {
      console.error(error);
      data = { data: null, message: error.code };
    });
  return data;
}
