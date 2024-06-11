import { getAllTransactions, getTenantCallBackUrl, updateTransaction } from "./dbFunctions";
import { CallbackStatus, TransactionStatus, tenant } from "./models";
import { verifySolanaTransaction } from "./solanaTransfer";
import axios from "axios";
import * as crypto from "crypto";

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
        console.log(trx, "trx");
        const status = (await verifySolanaTransaction(trx.txhash)) === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
        const tenant = await getTenantCallBackUrl(trx.tenantid);
        trx.status = status;
     //   console.log(tenant, "tenant");
        if (tenant != null && tenant.callbackurl != null && tenant.callbackurl != undefined) {
          const callback = await updateTenant(tenant, trx);
 const callbackStatus = callback ? CallbackStatus.SUCCESS : CallbackStatus.FAILED;

          const updatedTransaction = await updateTransaction(trx.transactionid, status,callbackStatus);
          updatedTransactions.push(updatedTransaction);

          //call the callback url with the updated transaction status
        }
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
  const tenantSecret = tenant.tenantsecret;
  const tenantHeaderKey = tenant.tenantheaderkey;
  const payload = JSON.stringify(transaction);
  const signature = await hash(payload,tenantSecret);

  const tenantHeader = {
    "Content-Type": "application/json",
    [tenantHeaderKey]: signature
  };
  console.log(tenantHeader);  
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
        console.log('Response:', response.data);
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


  // await fetch(tenant.callbackurl, {
  //   method: "POST",
  //   headers: tenantHeader,
  //     body : payload
  // })
  //   .then(async (response) => {
  //     console.log(response);
  //     data = await response.json();
  //     console.log(data,"response");
  //   })
  //   .catch((error) => {
  //     console.error(error);
  //     data = { data: null, message: error.code };
  //   });
  return data;
}

async function hash(payload: any,secret:string) {
  console.log("payload",payload);
  var data =  crypto
  .createHmac('sha256', secret)
  .update(payload, 'utf8')
  .digest('hex');  
  console.log("hashed-payload",data);
  return data;
}
