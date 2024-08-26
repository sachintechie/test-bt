"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const wallets = await listCustomerWallets(event.identity.resolverContext, event.arguments?.input?.customerId);
        return {
            status: 200,
            data: wallets,
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
async function listCustomerWallets(tenant, customerId) {
    console.log("customerId", customerId);
    try {
        const wallet = await (0, dbFunctions_1.getCustomerWalletsByCustomerId)(customerId, tenant);
        console.log(wallet, "Wallet");
        return wallet;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdEN1c3RvbWVyV2FsbGV0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3RDdXN0b21lcldhbGxldHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQW1FO0FBRzVELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUMxQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRW5CLE1BQU0sT0FBTyxHQUFHLE1BQU0sbUJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUF5QixFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ3hILE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDO0lBQ0osQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWxCVyxRQUFBLE9BQU8sV0FrQmxCO0FBRUYsS0FBSyxVQUFVLG1CQUFtQixDQUFDLE1BQWMsRUFBRSxVQUFrQjtJQUNuRSxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV0QyxJQUFJLENBQUM7UUFDSCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsNENBQThCLEVBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3hFLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzlCLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUM7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0Q3VzdG9tZXJXYWxsZXRzQnlDdXN0b21lcklkIH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5pbXBvcnQgeyB0ZW5hbnQgfSBmcm9tIFwiLi4vZGIvbW9kZWxzXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnkpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhldmVudCk7XG5cbiAgICBjb25zdCB3YWxsZXRzID0gYXdhaXQgbGlzdEN1c3RvbWVyV2FsbGV0cyhldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50LCBldmVudC5hcmd1bWVudHM/LmlucHV0Py5jdXN0b21lcklkKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiB3YWxsZXRzLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBsaXN0Q3VzdG9tZXJXYWxsZXRzKHRlbmFudDogdGVuYW50LCBjdXN0b21lcklkOiBzdHJpbmcpIHtcbiAgY29uc29sZS5sb2coXCJjdXN0b21lcklkXCIsIGN1c3RvbWVySWQpO1xuXG4gIHRyeSB7XG4gICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgZ2V0Q3VzdG9tZXJXYWxsZXRzQnlDdXN0b21lcklkKGN1c3RvbWVySWQsIHRlbmFudCk7XG4gICAgY29uc29sZS5sb2cod2FsbGV0LCBcIldhbGxldFwiKTtcbiAgICByZXR1cm4gd2FsbGV0O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgIHRocm93IGVycjtcbiAgfVxufVxuXG4iXX0=