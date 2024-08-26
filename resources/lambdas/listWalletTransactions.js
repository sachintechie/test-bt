"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const tokens = await getTransactions(event.identity.resolverContext, event.arguments?.input?.walletAddress);
        return {
            status: 200,
            data: tokens,
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
async function getTransactions(tenant, walletAddress) {
    console.log("Wallet Address", walletAddress);
    try {
        const wallet = await (0, dbFunctions_1.getTransactionsByWalletAddress)(walletAddress, tenant, "");
        console.log(wallet, "Wallet");
        return wallet;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFdhbGxldFRyYW5zYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3RXYWxsZXRUcmFuc2FjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQW1FO0FBRzVELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUMxQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRW5CLE1BQU0sTUFBTSxHQUFHLE1BQU0sZUFBZSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBeUIsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsQ0FBQztRQUN0SCxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsTUFBTTtZQUNaLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxHQUFHO1NBQ1gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUFsQlcsUUFBQSxPQUFPLFdBa0JsQjtBQUVGLEtBQUssVUFBVSxlQUFlLENBQUMsTUFBYyxFQUFFLGFBQXFCO0lBQ2xFLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsYUFBYSxDQUFDLENBQUM7SUFFN0MsSUFBSSxDQUFDO1FBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDRDQUE4QixFQUFDLGFBQWEsRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDL0UsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDOUIsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLE1BQU0sR0FBRyxDQUFDO0lBQ1osQ0FBQztBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRUcmFuc2FjdGlvbnNCeVdhbGxldEFkZHJlc3MgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcblxuICAgIGNvbnN0IHRva2VucyA9IGF3YWl0IGdldFRyYW5zYWN0aW9ucyhldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50LCBldmVudC5hcmd1bWVudHM/LmlucHV0Py53YWxsZXRBZGRyZXNzKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiB0b2tlbnMsXG4gICAgICBlcnJvcjogbnVsbFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFRyYW5zYWN0aW9ucyh0ZW5hbnQ6IHRlbmFudCwgd2FsbGV0QWRkcmVzczogc3RyaW5nKSB7XG4gIGNvbnNvbGUubG9nKFwiV2FsbGV0IEFkZHJlc3NcIiwgd2FsbGV0QWRkcmVzcyk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCB3YWxsZXQgPSBhd2FpdCBnZXRUcmFuc2FjdGlvbnNCeVdhbGxldEFkZHJlc3Mod2FsbGV0QWRkcmVzcywgdGVuYW50LCBcIlwiKTtcbiAgICBjb25zb2xlLmxvZyh3YWxsZXQsIFwiV2FsbGV0XCIpO1xuICAgIHJldHVybiB3YWxsZXQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgdGhyb3cgZXJyO1xuICB9XG59XG4iXX0=