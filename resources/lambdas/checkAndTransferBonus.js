"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const models_1 = require("../db/models");
const solanaFunctions_1 = require("../solana/solanaFunctions");
const airdropSplToken_1 = require("../solana/airdropSplToken");
const handler = async (event) => {
    try {
        const bonus = await transferBonus();
        return {
            status: 200,
            data: bonus,
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
async function transferBonus() {
    try {
        const schoolhackTenantId = "46a1ef54-2531-40a0-a42f-308b0598c24a";
        const tenant = await (0, dbFunctions_1.getTenantCallBackUrl)(schoolhackTenantId);
        const customerWallets = await (0, dbFunctions_1.getAllCustomerWalletForBonus)(schoolhackTenantId);
        const token = await (0, dbFunctions_1.getTokenBySymbol)("SHC");
        console.log("Customer Wallets", customerWallets, "tenant", tenant, token, "token");
        if (customerWallets.length > 0) {
            const transaction = await (0, airdropSplToken_1.airdropSPLToken)(customerWallets, 1, token?.decimalprecision ?? 0, "Solana", token?.contractaddress ?? '', tenant);
            if (transaction.trxHash != null) {
                const transactionStatus = await (0, solanaFunctions_1.verifySolanaTransaction)(transaction.trxHash);
                const txStatus = transactionStatus === "finalized" ? models_1.TransactionStatus.SUCCESS : models_1.TransactionStatus.PENDING;
                for (const customer of customerWallets) {
                    const updatedCustomer = await (0, dbFunctions_1.updateCustomerBonusStatus)(customer.customerid, "true", tenant.id);
                }
                return transaction;
            }
            else {
                return {
                    status: 200,
                    data: "Transaction Failed",
                    error: null
                };
            }
        }
        else {
            return {
                status: 200,
                data: "No Customers Found"
            };
        }
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hlY2tBbmRUcmFuc2ZlckJvbnVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2hlY2tBbmRUcmFuc2ZlckJvbnVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1EQU8yQjtBQUMzQix5Q0FBaUU7QUFDakUsK0RBQW9FO0FBQ3BFLCtEQUE0RDtBQUVyRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsTUFBTSxLQUFLLEdBQUcsTUFBTSxhQUFhLEVBQUUsQ0FBQztRQUNwQyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsS0FBSztZQUNYLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxHQUFHO1NBQ1gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUFoQlcsUUFBQSxPQUFPLFdBZ0JsQjtBQUVGLEtBQUssVUFBVSxhQUFhO0lBQzFCLElBQUksQ0FBQztRQUNILE1BQU0sa0JBQWtCLEdBQUcsc0NBQXNDLENBQUM7UUFDbEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGtDQUFvQixFQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDOUQsTUFBTSxlQUFlLEdBQUcsTUFBTSxJQUFBLDBDQUE0QixFQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDL0UsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFBLDhCQUFnQixFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ25GLElBQUksZUFBZSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUMvQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsaUNBQWUsRUFBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsSUFBSSxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxlQUFlLElBQUksRUFBRSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzVJLElBQUksV0FBVyxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLElBQUEseUNBQXVCLEVBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM3RSxNQUFNLFFBQVEsR0FBRyxpQkFBaUIsS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLDBCQUFpQixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsMEJBQWlCLENBQUMsT0FBTyxDQUFDO2dCQUMzRyxLQUFLLE1BQU0sUUFBUSxJQUFJLGVBQWUsRUFBQyxDQUFDO29CQUN0QyxNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUEsdUNBQXlCLEVBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNsRyxDQUFDO2dCQUNELE9BQU8sV0FBVyxDQUFDO1lBQ3JCLENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPO29CQUNMLE1BQU0sRUFBRSxHQUFHO29CQUNYLElBQUksRUFBRSxvQkFBb0I7b0JBQzFCLEtBQUssRUFBRSxJQUFJO2lCQUNaLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPO2dCQUNMLE1BQU0sRUFBRSxHQUFHO2dCQUNYLElBQUksRUFBRSxvQkFBb0I7YUFDM0IsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDakIsTUFBTSxHQUFHLENBQUM7SUFDWixDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldEFjY291bnQgfSBmcm9tIFwiQHNvbGFuYS9zcGwtdG9rZW5cIjtcbmltcG9ydCB7XG4gIGdldEFsbEN1c3RvbWVyV2FsbGV0Rm9yQm9udXMsXG4gIGdldEFsbFRyYW5zYWN0aW9ucyxcbiAgZ2V0VGVuYW50Q2FsbEJhY2tVcmwsXG4gIGdldFRva2VuQnlTeW1ib2wsXG4gIHVwZGF0ZUN1c3RvbWVyQm9udXNTdGF0dXMsXG4gIHVwZGF0ZVRyYW5zYWN0aW9uXG59IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgQ2FsbGJhY2tTdGF0dXMsIFRyYW5zYWN0aW9uU3RhdHVzIH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHsgdmVyaWZ5U29sYW5hVHJhbnNhY3Rpb24gfSBmcm9tIFwiLi4vc29sYW5hL3NvbGFuYUZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgYWlyZHJvcFNQTFRva2VuIH0gZnJvbSBcIi4uL3NvbGFuYS9haXJkcm9wU3BsVG9rZW5cIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJvbnVzID0gYXdhaXQgdHJhbnNmZXJCb251cygpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGRhdGE6IGJvbnVzLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiB0cmFuc2ZlckJvbnVzKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHNjaG9vbGhhY2tUZW5hbnRJZCA9IFwiNDZhMWVmNTQtMjUzMS00MGEwLWE0MmYtMzA4YjA1OThjMjRhXCI7XG4gICAgY29uc3QgdGVuYW50ID0gYXdhaXQgZ2V0VGVuYW50Q2FsbEJhY2tVcmwoc2Nob29saGFja1RlbmFudElkKTtcbiAgICBjb25zdCBjdXN0b21lcldhbGxldHMgPSBhd2FpdCBnZXRBbGxDdXN0b21lcldhbGxldEZvckJvbnVzKHNjaG9vbGhhY2tUZW5hbnRJZCk7XG4gICAgY29uc3QgdG9rZW4gPSBhd2FpdCBnZXRUb2tlbkJ5U3ltYm9sKFwiU0hDXCIpO1xuICAgIGNvbnNvbGUubG9nKFwiQ3VzdG9tZXIgV2FsbGV0c1wiLCBjdXN0b21lcldhbGxldHMsIFwidGVuYW50XCIsIHRlbmFudCwgdG9rZW4sIFwidG9rZW5cIik7XG4gICAgaWYgKGN1c3RvbWVyV2FsbGV0cy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCB0cmFuc2FjdGlvbiA9IGF3YWl0IGFpcmRyb3BTUExUb2tlbihjdXN0b21lcldhbGxldHMsIDEsIHRva2VuPy5kZWNpbWFscHJlY2lzaW9uID8/IDAsIFwiU29sYW5hXCIsIHRva2VuPy5jb250cmFjdGFkZHJlc3MgPz8gJycsIHRlbmFudCk7XG4gICAgICBpZiAodHJhbnNhY3Rpb24udHJ4SGFzaCAhPSBudWxsKSB7XG4gICAgICAgIGNvbnN0IHRyYW5zYWN0aW9uU3RhdHVzID0gYXdhaXQgdmVyaWZ5U29sYW5hVHJhbnNhY3Rpb24odHJhbnNhY3Rpb24udHJ4SGFzaCk7XG4gICAgICAgIGNvbnN0IHR4U3RhdHVzID0gdHJhbnNhY3Rpb25TdGF0dXMgPT09IFwiZmluYWxpemVkXCIgPyBUcmFuc2FjdGlvblN0YXR1cy5TVUNDRVNTIDogVHJhbnNhY3Rpb25TdGF0dXMuUEVORElORztcbiAgICAgICAgZm9yIChjb25zdCBjdXN0b21lciBvZiBjdXN0b21lcldhbGxldHMpe1xuICAgICAgICAgIGNvbnN0IHVwZGF0ZWRDdXN0b21lciA9IGF3YWl0IHVwZGF0ZUN1c3RvbWVyQm9udXNTdGF0dXMoY3VzdG9tZXIuY3VzdG9tZXJpZCwgXCJ0cnVlXCIsIHRlbmFudC5pZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRyYW5zYWN0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgICBkYXRhOiBcIlRyYW5zYWN0aW9uIEZhaWxlZFwiLFxuICAgICAgICAgIGVycm9yOiBudWxsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICBkYXRhOiBcIk5vIEN1c3RvbWVycyBGb3VuZFwiXG4gICAgICB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgICB0aHJvdyBlcnI7XG4gIH1cbn1cbiJdfQ==