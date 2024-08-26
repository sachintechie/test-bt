"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const wallets = await (0, dbFunctions_1.getCustomerKycByTenantId)(event.arguments?.input?.customerId, event.identity.resolverContext.id);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tZXJLeWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjdXN0b21lckt5Yy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFBOEQ7QUFFdkQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkIsTUFBTSxPQUFPLEdBQUcsTUFBTSxJQUFBLHNDQUF3QixFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUUsQ0FBQztRQUN2SCxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsT0FBTztZQUNiLEtBQUssRUFBRSxJQUFJO1NBQ1osQ0FBQztJQUNKLENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxHQUFHO1NBQ1gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUFsQlcsUUFBQSxPQUFPLFdBa0JsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7ICBnZXRDdXN0b21lckt5Y0J5VGVuYW50SWQgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcblxuICAgIGNvbnN0IHdhbGxldHMgPSBhd2FpdCBnZXRDdXN0b21lckt5Y0J5VGVuYW50SWQoIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmN1c3RvbWVySWQsZXZlbnQuaWRlbnRpdHkucmVzb2x2ZXJDb250ZXh0LmlkLCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgZGF0YTogd2FsbGV0cyxcbiAgICAgIGVycm9yOiBudWxsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coXCJJbiBjYXRjaCBCbG9jayBFcnJvclwiLCBlcnIpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZXJyXG4gICAgfTtcbiAgfVxufTtcblxuIl19