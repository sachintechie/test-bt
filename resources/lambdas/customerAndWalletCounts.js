"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const wallets = await (0, dbFunctions_1.CustomerAndWalletCounts)(event.identity.resolverContext);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tZXJBbmRXYWxsZXRDb3VudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjdXN0b21lckFuZFdhbGxldENvdW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFBNEQ7QUFHckQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLHFDQUF1QixFQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBeUIsQ0FBQyxDQUFDO1FBQ3hGLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxPQUFPO1lBQ2IsS0FBSyxFQUFFLElBQUk7U0FDWixDQUFDO0lBQ0osQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWxCVyxRQUFBLE9BQU8sV0FrQmxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ3VzdG9tZXJBbmRXYWxsZXRDb3VudHMgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcblxuICAgIGNvbnN0IHdhbGxldHMgPSBhd2FpdCBDdXN0b21lckFuZFdhbGxldENvdW50cyhldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50KTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiB3YWxsZXRzLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9O1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG5cblxuIl19