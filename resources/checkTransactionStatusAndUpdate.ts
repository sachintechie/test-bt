import { getAllStakingTransactions, getAllTransactions, getTenantCallBackUrl, updateStakingTransaction, updateTransaction } from "./dbFunctions";
import { CallbackStatus, TransactionStatus } from "./models";
import axios from "axios";
import * as crypto from "crypto";
import { verifySolanaTransaction } from "./solanaFunctions";

export const handler = async (event: any) => {
  try {
    const transactions = await updateTransactions();
    const stakingtransaction = await updateStakingTransactions();
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

  try {
    let updatedTransactions = [];
    const transactions = await getAllTransactions();
    for (const trx of transactions) {
      if (trx.status === TransactionStatus.PENDING) {
        const status = (await verifySolanaTransaction(trx.txhash)) === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
        const tenant = await getTenantCallBackUrl(trx.tenantid);
        trx.status = status;
        if (tenant != null && tenant.callbackurl != null && tenant.callbackurl != undefined) {
          const callback = await updateTenant(tenant, trx);
 const callbackStatus = callback ? CallbackStatus.SUCCESS : CallbackStatus.FAILED;

          const updatedTransaction = await updateTransaction(trx.transactionid, status,callbackStatus);
          updatedTransactions.push(updatedTransaction);

          //call the callback url with the updated transaction status
        }
        else{
          console.log("Tenant callbackurl not found");
        }
      }
    }
    return updatedTransactions;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateStakingTransactions() {

  try {
    let updatedTransactions = [];
    const transactions = await getAllStakingTransactions();
    for (const trx of transactions) {
      if (trx.status === TransactionStatus.PENDING) {
        const status = (await verifySolanaTransaction(trx.txhash)) === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
        const tenant = await getTenantCallBackUrl(trx.tenantid);
        trx.status = status;
        if (tenant != null && tenant.callbackurl != null && tenant.callbackurl != undefined) {
          const callback = await updateTenant(tenant, trx);
 const callbackStatus = callback ? CallbackStatus.SUCCESS : CallbackStatus.FAILED;

          const updatedTransaction = await updateStakingTransaction(trx.transactionid, status,callbackStatus);
          updatedTransactions.push(updatedTransaction);

          //call the callback url with the updated transaction status
        }
        else{
          console.log("Tenant callbackurl not found");
        }
      }
    }
    return updatedTransactions;
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function updateTenant(tenant: any, transaction: any) {
  var data;
  const tenantSecret = tenant.tenantsecret;
  const tenantHeaderKey = tenant.tenantheaderkey;
  const payload = JSON.stringify(transaction);
  const signature = await hash(payload,tenantSecret);

  const tenantHeader = {
    "Content-Type": "application/json",
    [tenantHeaderKey]: signature
  };
  // Options for the axios request
const options = {
  method: 'post',
  url: tenant.callbackurl,
  headers: tenantHeader,
  data: payload
};
// Send the request using axios
await axios(options)
    .then(response => {
        if(response.data != null && response.data != undefined && response.data == "Webhook received and verified."){
          data =true;

        }
        else{
          data = false;
        }
    })
    .catch(error => {
        console.error('Error:', error.response ? error.response.data : error.message);
    });
  return data;
}

async function hash(payload: any,secret:string) {
  var data =  crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');  
  return data;
}
