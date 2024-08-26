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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const models_1 = require("../db/models");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
const solanaFunctions_1 = require("../solana/solanaFunctions");
const handler = async (event) => {
    try {
        const transactions = await updateTransactions();
        const stakingtransaction = await updateStakingTransactions();
        return {
            status: 200,
            data: transactions,
            error: null
        };
    }
    catch (err) {
        console.log("In catch Block Error", err);
        return {
            status: 400,
            data: null,
            error: err
        };
    }
};
exports.handler = handler;
async function updateTransactions() {
    try {
        let updatedTransactions = [];
        const transactions = await (0, dbFunctions_1.getAllTransactions)();
        for (const trx of transactions) {
            if (trx.status === models_1.TransactionStatus.PENDING) {
                const status = (await (0, solanaFunctions_1.verifySolanaTransaction)(trx.txhash)) === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                const tenant = await (0, dbFunctions_1.getTenantCallBackUrl)(trx.tenantid);
                trx.status = status;
                if (tenant != null && tenant.callbackurl != null && tenant.callbackurl != undefined) {
                    const callback = await updateTenant(tenant, trx);
                    console.log(callback);
                    const callbackStatus = callback ? models_1.CallbackStatus.SUCCESS : models_1.CallbackStatus.FAILED;
                    const updatedTransaction = await (0, dbFunctions_1.updateTransaction)(trx.id, status, callbackStatus);
                    updatedTransactions.push(updatedTransaction);
                    //call the callback url with the updated transaction status
                }
                else {
                    console.log("Tenant callbackurl not found");
                }
            }
        }
        return updatedTransactions;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
async function updateStakingTransactions() {
    try {
        let updatedTransactions = [];
        const transactions = await (0, dbFunctions_1.getAllStakingTransactions)();
        for (const trx of transactions) {
            if (trx.status === models_1.TransactionStatus.PENDING) {
                const status = (await (0, solanaFunctions_1.verifySolanaTransaction)(trx.txhash)) === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                const tenant = await (0, dbFunctions_1.getTenantCallBackUrl)(trx.tenantid);
                trx.status = status;
                if (tenant != null) {
                    //  const callback = await updateTenant(tenant, trx);
                    const callbackStatus = models_1.CallbackStatus.PENDING;
                    const updatedTransaction = await (0, dbFunctions_1.updateStakingTransaction)(trx.id, status, callbackStatus);
                    updatedTransactions.push(updatedTransaction);
                    //call the callback url with the updated transaction status
                }
                else {
                    console.log("Tenant callbackurl not found");
                }
            }
        }
        return updatedTransactions;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
async function updateTenant(tenant, transaction) {
    var data;
    const tenantSecret = tenant.tenantsecret;
    const tenantHeaderKey = tenant.tenantheaderkey;
    const payload = JSON.stringify(transaction);
    const signature = await hash(payload, tenantSecret);
    const tenantHeader = {
        "Content-Type": "application/json",
        [tenantHeaderKey]: signature
    };
    // Options for the axios request
    const options = {
        method: "post",
        url: tenant.callbackurl,
        headers: tenantHeader,
        data: payload
    };
    // Send the request using axios
    await (0, axios_1.default)(options)
        .then((response) => {
        console.log("Response:", response);
        if (response.data != null && response.data != undefined && response.data == "Webhook received and verified.") {
            data = true;
        }
        else {
            data = false;
        }
    })
        .catch((error) => {
        console.error("Error:", error.response ? error.response.data : error.message);
    });
    return data;
}
async function hash(payload, secret) {
    var data = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
    return data;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tUcmFuc2FjdGlvblN0YXR1c0FuZFVwZGF0ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNoZWNrVHJhbnNhY3Rpb25TdGF0dXNBbmRVcGRhdGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxtREFNMkI7QUFDM0IseUNBQWlFO0FBQ2pFLGtEQUEwQjtBQUMxQiwrQ0FBaUM7QUFDakMsK0RBQW9FO0FBRTdELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUMxQyxJQUFJLENBQUM7UUFDSCxNQUFNLFlBQVksR0FBRyxNQUFNLGtCQUFrQixFQUFFLENBQUM7UUFDaEQsTUFBTSxrQkFBa0IsR0FBRyxNQUFNLHlCQUF5QixFQUFFLENBQUM7UUFDN0QsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLFlBQVk7WUFDbEIsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDO0lBQ0osQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWpCVyxRQUFBLE9BQU8sV0FpQmxCO0FBRUYsS0FBSyxVQUFVLGtCQUFrQjtJQUMvQixJQUFJLENBQUM7UUFDSCxJQUFJLG1CQUFtQixHQUFHLEVBQUUsQ0FBQztRQUM3QixNQUFNLFlBQVksR0FBRyxNQUFNLElBQUEsZ0NBQWtCLEdBQUUsQ0FBQztRQUNoRCxLQUFLLE1BQU0sR0FBRyxJQUFJLFlBQVksRUFBRSxDQUFDO1lBQy9CLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSywwQkFBaUIsQ0FBQyxPQUFPLEVBQUUsQ0FB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ZixDQUFDO0lBQ0gsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hGLENBQUMsQ0FBQyxDQUFDO0lBQ0wsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsS0FBSyxVQUFVLElBQUksQ0FBQyxPQUFZLEVBQUUsTUFBYztJQUM5QyxJQUFJLElBQUksR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRixPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBnZXRBbGxTdGFraW5nVHJhbnNhY3Rpb25zLFxuICBnZXRBbGxUcmFuc2FjdGlvbnMsXG4gIGdldFRlbmFudENhbGxCYWNrVXJsLFxuICB1cGRhdGVTdGFraW5nVHJhbnNhY3Rpb24sXG4gIHVwZGF0ZVRyYW5zYWN0aW9uXG59IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgQ2FsbGJhY2tTdGF0dXMsIFRyYW5zYWN0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IGF4aW9zIGZyb20gXCJheGlvc1wiO1xuaW1wb3J0ICogYXMgY3J5cHRvIGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCB7IHZlcmlmeVNvbGFuYVRyYW5zYWN0aW9uIH0gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IHRyYW5zYWN0aW9ucyA9IGF3YWl0IHVwZGF0ZVRyYW5zYWN0aW9ucygpO1xuICAgIGNvbnN0IHN0YWtpbmd0cmFuc2FjdGlvbiA9IGF3YWl0IHVwZGF0ZVN0YWtpbmdUcmFuc2FjdGlvbnMoKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiB0cmFuc2FjdGlvbnMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVRyYW5zYWN0aW9ucygpIHtcbiAgdHJ5IHtcbiAgICBsZXQgdXBkYXRlZFRyYW5zYWN0aW9ucyA9IFtdO1xuICAgIGNvbnN0IHRyYW5zYWN0aW9ucyA9IGF3YWl0IGdldEFsbFRyYW5zYWN0aW9ucygpO1xuICAgIGZvciAoY29uc3QgdHJ4IG9mIHRyYW5zYWN0aW9ucykge1xuICAgICAgaWYgKHRyeC5zdGF0dXMgPT09IFRyYW5zYWN0aW9uU3RhdHVzLlBFTkRJTkcpIHtcbiAgICAgICAgY29uc3Qgc3RhdHVzID0gKGF3YWl0IHZlcmlmeVNvbGFuYVRyYW5zYWN0aW9uKHRyeC50eGhhc2gpKSA9PT0gXCJmaW5hbGl6ZWRcIiA/IFRyYW5zYWN0aW9uU3RhdHVzLlNVQ0NFU1MgOiBUcmFuc2FjdGlvblN0YXR1cy5QRU5ESU5HO1xuICAgICAgICBjb25zdCB0ZW5hbnQgPSBhd2FpdCBnZXRUZW5hbnRDYWxsQmFja1VybCh0cngudGVuYW50aWQpO1xuICAgICAgICB0cnguc3RhdHVzID0gc3RhdHVzO1xuICAgICAgICBpZiAodGVuYW50ICE9IG51bGwgJiYgdGVuYW50LmNhbGxiYWNrdXJsICE9IG51bGwgJiYgdGVuYW50LmNhbGxiYWNrdXJsICE9IHVuZGVmaW5lZCkge1xuICAgICAgICAgIGNvbnN0IGNhbGxiYWNrID0gYXdhaXQgdXBkYXRlVGVuYW50KHRlbmFudCwgdHJ4KTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhjYWxsYmFjayk7XG4gICAgICAgICAgY29uc3QgY2FsbGJhY2tTdGF0dXMgPSBjYWxsYmFjayA/IENhbGxiYWNrU3RhdHVzLlNVQ0NFU1MgOiBDYWxsYmFja1N0YXR1cy5GQUlMRUQ7XG5cbiAgICAgICAgICBjb25zdCB1cGRhdGVkVHJhbnNhY3Rpb24gPSBhd2FpdCB1cGRhdGVUcmFuc2FjdGlvbih0cnguaWQsIHN0YXR1cywgY2FsbGJhY2tTdGF0dXMpO1xuICAgICAgICAgIHVwZGF0ZWRUcmFuc2FjdGlvbnMucHVzaCh1cGRhdGVkVHJhbnNhY3Rpb24pO1xuXG4gICAgICAgICAgLy9jYWxsIHRoZSBjYWxsYmFjayB1cmwgd2l0aCB0aGUgdXBkYXRlZCB0cmFuc2FjdGlvbiBzdGF0dXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIlRlbmFudCBjYWxsYmFja3VybCBub3QgZm91bmRcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHVwZGF0ZWRUcmFuc2FjdGlvbnM7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVN0YWtpbmdUcmFuc2FjdGlvbnMoKSB7XG4gIHRyeSB7XG4gICAgbGV0IHVwZGF0ZWRUcmFuc2FjdGlvbnMgPSBbXTtcbiAgICBjb25zdCB0cmFuc2FjdGlvbnMgPSBhd2FpdCBnZXRBbGxTdGFraW5nVHJhbnNhY3Rpb25zKCk7XG4gICAgZm9yIChjb25zdCB0cnggb2YgdHJhbnNhY3Rpb25zKSB7XG4gICAgICBpZiAodHJ4LnN0YXR1cyA9PT0gVHJhbnNhY3Rpb25TdGF0dXMuUEVORElORykge1xuICAgICAgICBjb25zdCBzdGF0dXMgPSAoYXdhaXQgdmVyaWZ5U29sYW5hVHJhbnNhY3Rpb24odHJ4LnR4aGFzaCkpID09PSBcImZpbmFsaXplZFwiID8gVHJhbnNhY3Rpb25TdGF0dXMuU1VDQ0VTUyA6IFRyYW5zYWN0aW9uU3RhdHVzLlBFTkRJTkc7XG4gICAgICAgIGNvbnN0IHRlbmFudCA9IGF3YWl0IGdldFRlbmFudENhbGxCYWNrVXJsKHRyeC50ZW5hbnRpZCk7XG4gICAgICAgIHRyeC5zdGF0dXMgPSBzdGF0dXM7XG4gICAgICAgIGlmICh0ZW5hbnQgIT0gbnVsbCApIHtcbiAgICAgICAgLy8gIGNvbnN0IGNhbGxiYWNrID0gYXdhaXQgdXBkYXRlVGVuYW50KHRlbmFudCwgdHJ4KTtcbiAgICAgICAgICBjb25zdCBjYWxsYmFja1N0YXR1cyA9ICBDYWxsYmFja1N0YXR1cy5QRU5ESU5HO1xuXG4gICAgICAgICAgY29uc3QgdXBkYXRlZFRyYW5zYWN0aW9uID0gYXdhaXQgdXBkYXRlU3Rha2luZ1RyYW5zYWN0aW9uKHRyeC5pZCwgc3RhdHVzLCBjYWxsYmFja1N0YXR1cyk7XG4gICAgICAgICAgdXBkYXRlZFRyYW5zYWN0aW9ucy5wdXNoKHVwZGF0ZWRUcmFuc2FjdGlvbik7XG5cbiAgICAgICAgICAvL2NhbGwgdGhlIGNhbGxiYWNrIHVybCB3aXRoIHRoZSB1cGRhdGVkIHRyYW5zYWN0aW9uIHN0YXR1c1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiVGVuYW50IGNhbGxiYWNrdXJsIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdXBkYXRlZFRyYW5zYWN0aW9ucztcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gdXBkYXRlVGVuYW50KHRlbmFudDogYW55LCB0cmFuc2FjdGlvbjogYW55KSB7XG4gIHZhciBkYXRhO1xuICBjb25zdCB0ZW5hbnRTZWNyZXQgPSB0ZW5hbnQudGVuYW50c2VjcmV0O1xuICBjb25zdCB0ZW5hbnRIZWFkZXJLZXkgPSB0ZW5hbnQudGVuYW50aGVhZGVya2V5O1xuICBjb25zdCBwYXlsb2FkID0gSlNPTi5zdHJpbmdpZnkodHJhbnNhY3Rpb24pO1xuICBjb25zdCBzaWduYXR1cmUgPSBhd2FpdCBoYXNoKHBheWxvYWQsIHRlbmFudFNlY3JldCk7XG5cbiAgY29uc3QgdGVuYW50SGVhZGVyID0ge1xuICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgIFt0ZW5hbnRIZWFkZXJLZXldOiBzaWduYXR1cmVcbiAgfTtcbiAgLy8gT3B0aW9ucyBmb3IgdGhlIGF4aW9zIHJlcXVlc3RcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICBtZXRob2Q6IFwicG9zdFwiLFxuICAgIHVybDogdGVuYW50LmNhbGxiYWNrdXJsLFxuICAgIGhlYWRlcnM6IHRlbmFudEhlYWRlcixcbiAgICBkYXRhOiBwYXlsb2FkXG4gIH07XG4gIC8vIFNlbmQgdGhlIHJlcXVlc3QgdXNpbmcgYXhpb3NcbiAgYXdhaXQgYXhpb3Mob3B0aW9ucylcbiAgICAudGhlbigocmVzcG9uc2UpID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKFwiUmVzcG9uc2U6XCIsIHJlc3BvbnNlKTtcbiAgICAgIGlmIChyZXNwb25zZS5kYXRhICE9IG51bGwgJiYgcmVzcG9uc2UuZGF0YSAhPSB1bmRlZmluZWQgJiYgcmVzcG9uc2UuZGF0YSA9PSBcIldlYmhvb2sgcmVjZWl2ZWQgYW5kIHZlcmlmaWVkLlwiKSB7XG4gICAgICAgIGRhdGEgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YSA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0pXG4gICAgLmNhdGNoKChlcnJvcikgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yOlwiLCBlcnJvci5yZXNwb25zZSA/IGVycm9yLnJlc3BvbnNlLmRhdGEgOiBlcnJvci5tZXNzYWdlKTtcbiAgICB9KTtcbiAgcmV0dXJuIGRhdGE7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhc2gocGF5bG9hZDogYW55LCBzZWNyZXQ6IHN0cmluZykge1xuICB2YXIgZGF0YSA9IGNyeXB0by5jcmVhdGVIbWFjKFwic2hhMjU2XCIsIHNlY3JldCkudXBkYXRlKHBheWxvYWQsIFwidXRmOFwiKS5kaWdlc3QoXCJoZXhcIik7XG4gIHJldHVybiBkYXRhO1xufVxuIl19