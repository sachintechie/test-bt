"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTokens = exports.getCustomer = exports.getWalletAndTokenByWalletAddress = exports.getWalletByCustomer = exports.createWallet = exports.createCustomer = void 0;
const PgClient_1 = require("./PgClient");
const cs = require("@cubist-labs/cubesigner-sdk");
async function createCustomer(customer) {
    try {
        let query = `INSERT INTO customer (tenantUserId, tenantId, emailId,name,cubistUserId,isActive,createdat)
      VALUES (${customer}); `;
        const res = await (0, PgClient_1.executeQuery)(query);
        const customerRow = res.rows[0];
        return to_customer(customerRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.createCustomer = createCustomer;
async function createWallet(org, cubistUserId, customer) {
    try {
        // Create a key for the OIDC user
        const key = await org.createKey(cs.Ed25519.Solana, cubistUserId);
        let query = `INSERT INTO wallet (customerid, walletaddress, symbol,walletid,chaintype,wallettype,isactive,createdat)
      VALUES (${(customer.id,
            key.materialId,
            "SOL",
            key.id,
            "Solana",
            key.cached.type,
            true,
            new Date().toISOString())}); `;
        const res = await (0, PgClient_1.executeQuery)(query);
        const walletRow = res.rows[0];
        return to_wallet(walletRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.createWallet = createWallet;
async function getWalletByCustomer(tenantUserId, symbol, tenant) {
    try {
        let query = `select * from customer  INNER JOIN wallet 
      ON  wallet.customerid = customer.id where customer.tenantUserId =  '${tenantUserId}' AND customer.tenantId = '${tenant.id}';`;
        const res = await (0, PgClient_1.executeQuery)(query);
        const walletRow = res.rows[0];
        return to_wallet(walletRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.getWalletByCustomer = getWalletByCustomer;
async function getWalletAndTokenByWalletAddress(walletAddress, tenant) {
    try {
        console.log("Wallet Address", walletAddress);
        let query = `select * from wallet  INNER JOIN token 
    ON  wallet.chaintype = token.chaintype where wallet.walletaddress = '${walletAddress}';`;
        const res = await (0, PgClient_1.executeQuery)(query);
        const walletRow = res.rows;
        return to_wallet_token(walletRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.getWalletAndTokenByWalletAddress = getWalletAndTokenByWalletAddress;
async function getCustomer(tenantUserId, tenantId) {
    try {
        let query = `SELECT * FROM customer WHERE tenantUserId = '${tenantUserId}' AND tenantId = '${tenantId}';`;
        const res = await (0, PgClient_1.executeQuery)(query);
        const customerRow = res.rows[0];
        return to_customer(customerRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.getCustomer = getCustomer;
async function getTokens(chainType) {
    try {
        let query = `SELECT * FROM customer WHERE chaintype = '${chainType}';`;
        const res = await (0, PgClient_1.executeQuery)(query);
        const tokenRow = res.rows[0];
        return to_token(tokenRow);
    }
    catch (err) {
        console.error(err);
        throw err;
    }
}
exports.getTokens = getTokens;
const to_wallet = (itemRow) => {
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
const to_wallet_token = (itemRow) => {
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
const to_customer = (itemRow) => {
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
const to_token = (itemRow) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGJGdW5jdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYkZ1bmN0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5Q0FBMEM7QUFFMUMsa0RBQWtEO0FBRTNDLEtBQUssVUFBVSxjQUFjLENBQUMsUUFBa0I7SUFDckQsSUFBSSxDQUFDO1FBQ0gsSUFBSSxLQUFLLEdBQUc7Z0JBQ0EsUUFBUSxLQUFLLENBQUM7UUFDMUIsTUFBTSxHQUFHLEdBQUcsTUFBTSxJQUFBLHVCQUFZLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsTUFBTSxXQUFXLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoQyxPQUFPLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkIsTUFBTSxHQUFHLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQztBQVhELHdDQVdDO0FBRU0sS0FBSyxVQUFVLFlBQVksQ0FDaEMsR0FBUSxFQUNSLFlBQW9CLEVBQ3BCLFFBQWtCO0lBRWxCLElBQUksQ0FBQztRQUNILGlDQUFpQztRQUNqQyxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDakUsSUFBSSxLQUFLLEdBQUc7Z0JBRVIsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNaLEdBQUcsQ0FBQyxVQUFVO1lBQ2QsS0FBSztZQUNMLEdBQUcsQ0FBQyxFQUFFO1lBQ04sUUFBUTtZQUNSLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSTtZQUNmLElBQUk7WUFDSixJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUMxQixLQUFLLENBQUM7UUFDUixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUEs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QyxDQUFDO0FBQ0osTUFBTSxXQUFXLEdBQUcsQ0FBQyxPQUFpQixFQUFZLEVBQUU7SUFDbEQsT0FBTztRQUNMLEVBQUUsRUFBRSxPQUFPLENBQUMsRUFBRTtRQUNkLFlBQVksRUFBRSxPQUFPLENBQUMsWUFBWTtRQUNsQyxRQUFRLEVBQUUsT0FBTyxDQUFDLFFBQVE7UUFDMUIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxPQUFPO1FBQ3hCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtRQUNsQixZQUFZLEVBQUUsT0FBTyxDQUFDLFlBQVk7UUFDbEMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1FBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztLQUM3QixDQUFDO0FBQ0osQ0FBQyxDQUFDO0FBRUYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxPQUFjLEVBQVMsRUFBRTtJQUN2QyxPQUFPO1FBQ0wsRUFBRSxFQUFFLE9BQU8sQ0FBQyxFQUFFO1FBQ2QsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO1FBQ2xCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztRQUM1QixNQUFNLEVBQUUsT0FBTyxDQUFDLE1BQU07UUFDdEIsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO1FBQ3hDLGdCQUFnQixFQUFFLE9BQU8sQ0FBQyxnQkFBZ0I7UUFDMUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1FBQzFCLFNBQVMsRUFBRSxPQUFPLENBQUMsU0FBUztLQUM3QixDQUFDO0FBQ0osQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhlY3V0ZVF1ZXJ5IH0gZnJvbSBcIi4vUGdDbGllbnRcIjtcclxuaW1wb3J0IHsgY3VzdG9tZXIsIHRlbmFudCwgdG9rZW4sIHdhbGxldCB9IGZyb20gXCIuL21vZGVsc1wiO1xyXG5pbXBvcnQgKiBhcyBjcyBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tZXIoY3VzdG9tZXI6IGN1c3RvbWVyKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCBxdWVyeSA9IGBJTlNFUlQgSU5UTyBjdXN0b21lciAodGVuYW50VXNlcklkLCB0ZW5hbnRJZCwgZW1haWxJZCxuYW1lLGN1YmlzdFVzZXJJZCxpc0FjdGl2ZSxjcmVhdGVkYXQpXHJcbiAgICAgIFZBTFVFUyAoJHtjdXN0b21lcn0pOyBgO1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcclxuICAgIGNvbnN0IGN1c3RvbWVyUm93ID0gcmVzLnJvd3NbMF07XHJcbiAgICByZXR1cm4gdG9fY3VzdG9tZXIoY3VzdG9tZXJSb3cpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgdGhyb3cgZXJyO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZVdhbGxldChcclxuICBvcmc6IGFueSxcclxuICBjdWJpc3RVc2VySWQ6IHN0cmluZyxcclxuICBjdXN0b21lcjogY3VzdG9tZXJcclxuKSB7XHJcbiAgdHJ5IHtcclxuICAgIC8vIENyZWF0ZSBhIGtleSBmb3IgdGhlIE9JREMgdXNlclxyXG4gICAgY29uc3Qga2V5ID0gYXdhaXQgb3JnLmNyZWF0ZUtleShjcy5FZDI1NTE5LlNvbGFuYSwgY3ViaXN0VXNlcklkKTtcclxuICAgIGxldCBxdWVyeSA9IGBJTlNFUlQgSU5UTyB3YWxsZXQgKGN1c3RvbWVyaWQsIHdhbGxldGFkZHJlc3MsIHN5bWJvbCx3YWxsZXRpZCxjaGFpbnR5cGUsd2FsbGV0dHlwZSxpc2FjdGl2ZSxjcmVhdGVkYXQpXHJcbiAgICAgIFZBTFVFUyAoJHtcclxuICAgICAgICAoY3VzdG9tZXIuaWQsXHJcbiAgICAgICAga2V5Lm1hdGVyaWFsSWQsXHJcbiAgICAgICAgXCJTT0xcIixcclxuICAgICAgICBrZXkuaWQsXHJcbiAgICAgICAgXCJTb2xhbmFcIixcclxuICAgICAgICBrZXkuY2FjaGVkLnR5cGUsXHJcbiAgICAgICAgdHJ1ZSxcclxuICAgICAgICBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpXHJcbiAgICAgIH0pOyBgO1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcclxuICAgIGNvbnN0IHdhbGxldFJvdyA9IHJlcy5yb3dzWzBdO1xyXG4gICAgcmV0dXJuIHRvX3dhbGxldCh3YWxsZXRSb3cpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgdGhyb3cgZXJyO1xyXG4gIH1cclxufVxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0V2FsbGV0QnlDdXN0b21lcihcclxuICB0ZW5hbnRVc2VySWQ6IHN0cmluZyxcclxuICBzeW1ib2w6IHN0cmluZyxcclxuICB0ZW5hbnQ6IHRlbmFudFxyXG4pIHtcclxuICB0cnkge1xyXG4gICAgbGV0IHF1ZXJ5ID0gYHNlbGVjdCAqIGZyb20gY3VzdG9tZXIgIElOTkVSIEpPSU4gd2FsbGV0IFxyXG4gICAgICBPTiAgd2FsbGV0LmN1c3RvbWVyaWQgPSBjdXN0b21lci5pZCB3aGVyZSBjdXN0b21lci50ZW5hbnRVc2VySWQgPSAgJyR7dGVuYW50VXNlcklkfScgQU5EIGN1c3RvbWVyLnRlbmFudElkID0gJyR7dGVuYW50LmlkfSc7YDtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGV4ZWN1dGVRdWVyeShxdWVyeSk7XHJcbiAgICBjb25zdCB3YWxsZXRSb3cgPSByZXMucm93c1swXTtcclxuICAgIHJldHVybiB0b193YWxsZXQod2FsbGV0Um93KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgIHRocm93IGVycjtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRXYWxsZXRBbmRUb2tlbkJ5V2FsbGV0QWRkcmVzcyhcclxuICB3YWxsZXRBZGRyZXNzOiBzdHJpbmcsXHJcbiAgdGVuYW50OiB0ZW5hbnRcclxuKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKFwiV2FsbGV0IEFkZHJlc3NcIiwgd2FsbGV0QWRkcmVzcyk7XHJcbiAgICBsZXQgcXVlcnkgPSBgc2VsZWN0ICogZnJvbSB3YWxsZXQgIElOTkVSIEpPSU4gdG9rZW4gXHJcbiAgICBPTiAgd2FsbGV0LmNoYWludHlwZSA9IHRva2VuLmNoYWludHlwZSB3aGVyZSB3YWxsZXQud2FsbGV0YWRkcmVzcyA9ICcke3dhbGxldEFkZHJlc3N9JztgO1xyXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZXhlY3V0ZVF1ZXJ5KHF1ZXJ5KTtcclxuICAgIGNvbnN0IHdhbGxldFJvdyA9IHJlcy5yb3dzO1xyXG4gICAgcmV0dXJuIHRvX3dhbGxldF90b2tlbih3YWxsZXRSb3cpO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgdGhyb3cgZXJyO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEN1c3RvbWVyKHRlbmFudFVzZXJJZDogc3RyaW5nLCB0ZW5hbnRJZDogbnVtYmVyKSB7XHJcbiAgdHJ5IHtcclxuICAgIGxldCBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NIGN1c3RvbWVyIFdIRVJFIHRlbmFudFVzZXJJZCA9ICcke3RlbmFudFVzZXJJZH0nIEFORCB0ZW5hbnRJZCA9ICcke3RlbmFudElkfSc7YDtcclxuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGV4ZWN1dGVRdWVyeShxdWVyeSk7XHJcbiAgICBjb25zdCBjdXN0b21lclJvdyA9IHJlcy5yb3dzWzBdO1xyXG4gICAgcmV0dXJuIHRvX2N1c3RvbWVyKGN1c3RvbWVyUm93KTtcclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgIHRocm93IGVycjtcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRUb2tlbnMoY2hhaW5UeXBlOiBzdHJpbmcpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGxldCBxdWVyeSA9IGBTRUxFQ1QgKiBGUk9NIGN1c3RvbWVyIFdIRVJFIGNoYWludHlwZSA9ICcke2NoYWluVHlwZX0nO2A7XHJcbiAgICAgIGNvbnN0IHJlcyA9IGF3YWl0IGV4ZWN1dGVRdWVyeShxdWVyeSk7XHJcbiAgICAgIGNvbnN0IHRva2VuUm93ID0gcmVzLnJvd3NbMF07XHJcbiAgICAgIHJldHVybiB0b190b2tlbih0b2tlblJvdyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuY29uc3QgdG9fd2FsbGV0ID0gKGl0ZW1Sb3c6IHdhbGxldCk6IHdhbGxldCA9PiB7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBpdGVtUm93LmlkLFxyXG4gICAgY3VzdG9tZXJpZDogaXRlbVJvdy5jdXN0b21lcmlkLFxyXG4gICAgd2FsbGV0YWRkcmVzczogaXRlbVJvdy53YWxsZXRhZGRyZXNzLFxyXG4gICAgc3ltYm9sOiBpdGVtUm93LnN5bWJvbCxcclxuICAgIHdhbGxldGlkOiBpdGVtUm93LndhbGxldGlkLFxyXG4gICAgaXNhY3RpdmU6IGl0ZW1Sb3cuaXNhY3RpdmUsXHJcbiAgICBjcmVhdGVkYXQ6IGl0ZW1Sb3cuY3JlYXRlZGF0LFxyXG4gICAgY2hhaW50eXBlOiBpdGVtUm93LmNoYWludHlwZSxcclxuICAgIHdhbGxldHR5cGU6IGl0ZW1Sb3cud2FsbGV0dHlwZSxcclxuICB9O1xyXG59O1xyXG5jb25zdCB0b193YWxsZXRfdG9rZW4gPSAoaXRlbVJvdzogd2FsbGV0W10pOiB3YWxsZXRbXSA9PiB7XHJcbiAgICB2YXIgZGF0YSA9IGl0ZW1Sb3cubWFwKChpdGVtKSA9PiB7XHJcbiAgICAgIHJldHVybiB7XHJcbiAgICAgICAgaWQ6IGl0ZW0uaWQsXHJcbiAgICAgICAgY3VzdG9tZXJpZDogaXRlbS5jdXN0b21lcmlkLFxyXG4gICAgICAgIHdhbGxldGFkZHJlc3M6IGl0ZW0ud2FsbGV0YWRkcmVzcyxcclxuICAgICAgICBzeW1ib2w6IGl0ZW0uc3ltYm9sLFxyXG4gICAgICAgIHdhbGxldGlkOiBpdGVtLndhbGxldGlkLFxyXG4gICAgICAgIGlzYWN0aXZlOiBpdGVtLmlzYWN0aXZlLFxyXG4gICAgICAgIGNyZWF0ZWRhdDogaXRlbS5jcmVhdGVkYXQsXHJcbiAgICAgICAgY2hhaW50eXBlOiBpdGVtLmNoYWludHlwZSxcclxuICAgICAgICB3YWxsZXR0eXBlOiBpdGVtLndhbGxldHR5cGUsXHJcbiAgICAgICAgZGVjaW1hbHByZWNpc2lvbjogaXRlbS5kZWNpbWFscHJlY2lzaW9uLFxyXG4gICAgICAgIGNvbnRyYWN0YWRkcmVzczogaXRlbS5jb250cmFjdGFkZHJlc3MsXHJcbiAgICAgICAgXHJcblxyXG4gICAgICB9O1xyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9O1xyXG5jb25zdCB0b19jdXN0b21lciA9IChpdGVtUm93OiBjdXN0b21lcik6IGN1c3RvbWVyID0+IHtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IGl0ZW1Sb3cuaWQsXHJcbiAgICB0ZW5hbnR1c2VyaWQ6IGl0ZW1Sb3cudGVuYW50dXNlcmlkLFxyXG4gICAgdGVuYW50aWQ6IGl0ZW1Sb3cudGVuYW50aWQsXHJcbiAgICBlbWFpbGlkOiBpdGVtUm93LmVtYWlsaWQsXHJcbiAgICBuYW1lOiBpdGVtUm93Lm5hbWUsXHJcbiAgICBjdWJpc3R1c2VyaWQ6IGl0ZW1Sb3cuY3ViaXN0dXNlcmlkLFxyXG4gICAgaXNhY3RpdmU6IGl0ZW1Sb3cuaXNhY3RpdmUsXHJcbiAgICBjcmVhdGVkYXQ6IGl0ZW1Sb3cuY3JlYXRlZGF0LFxyXG4gIH07XHJcbn07XHJcblxyXG5jb25zdCB0b190b2tlbiA9IChpdGVtUm93OiB0b2tlbik6IHRva2VuID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIGlkOiBpdGVtUm93LmlkLFxyXG4gICAgICBuYW1lOiBpdGVtUm93Lm5hbWUsXHJcbiAgICAgIGNoYWludHlwZTogaXRlbVJvdy5jaGFpbnR5cGUsXHJcbiAgICAgIHN5bWJvbDogaXRlbVJvdy5zeW1ib2wsXHJcbiAgICAgIGNvbnRyYWN0YWRkcmVzczogaXRlbVJvdy5jb250cmFjdGFkZHJlc3MsXHJcbiAgICAgIGRlY2ltYWxwcmVjaXNpb246IGl0ZW1Sb3cuZGVjaW1hbHByZWNpc2lvbixcclxuICAgICAgaXNhY3RpdmU6IGl0ZW1Sb3cuaXNhY3RpdmUsXHJcbiAgICAgIGNyZWF0ZWRhdDogaXRlbVJvdy5jcmVhdGVkYXQsXHJcbiAgICB9O1xyXG4gIH07XHJcbiJdfQ==