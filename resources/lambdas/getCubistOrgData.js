"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const cubistFunctions_1 = require("../cubist/cubistFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const data = await (0, cubistFunctions_1.getCubistOrgData)(event.identity.resolverContext.id);
        return {
            status: data.data != null ? 200 : 400,
            data: data.data,
            error: data.error
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0Q3ViaXN0T3JnRGF0YS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldEN1YmlzdE9yZ0RhdGEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQTZEO0FBRXRELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUMxQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRW5CLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSxrQ0FBZ0IsRUFBQyxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RSxPQUFPO1lBQ0wsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7WUFDckMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ2YsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO1NBQ2xCLENBQUM7SUFDSixDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBbEJXLFFBQUEsT0FBTyxXQWtCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRDdWJpc3RPcmdEYXRhIH0gZnJvbSBcIi4uL2N1YmlzdC9jdWJpc3RGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBnZXRDdWJpc3RPcmdEYXRhKGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dC5pZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogZGF0YS5kYXRhICE9IG51bGwgPyAyMDAgOiA0MDAsXG4gICAgICBkYXRhOiBkYXRhLmRhdGEsXG4gICAgICBlcnJvcjogZGF0YS5lcnJvclxuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG5cblxuXG4iXX0=