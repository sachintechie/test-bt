"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const sumsubFunctions_1 = require("../kyc/sumsubFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const resp = await (0, sumsubFunctions_1.generateAccessToken)(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
        const response = {
            status: 200,
            data: { token: resp.token, customerId: resp.userId },
            error: null
        };
        console.log("generate sumsub token", response);
        return response;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0S3ljQWNjZXNzVG9rZW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXRLeWNBY2Nlc3NUb2tlbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw0REFBNkQ7QUFFdEQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN4RCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU1QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUEscUNBQW1CLEVBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRTlHLE1BQU0sUUFBUSxHQUFHO1lBQ2YsTUFBTSxFQUFDLEdBQUc7WUFDVixJQUFJLEVBQUUsRUFBQyxLQUFLLEVBQUcsSUFBSSxDQUFDLEtBQUssRUFBQyxVQUFVLEVBQUcsSUFBSSxDQUFDLE1BQU0sRUFBQztZQUNuRCxLQUFLLEVBQUUsSUFBSTtTQUNaLENBQUM7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRS9DLE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBdEJXLFFBQUEsT0FBTyxXQXNCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZW5lcmF0ZUFjY2Vzc1Rva2VuIH0gZnJvbSBcIi4uL2t5Yy9zdW1zdWJGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQsIGNvbnRleHQpO1xuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IGdlbmVyYXRlQWNjZXNzVG9rZW4oZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY3VzdG9tZXJJZCwgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8ubGV2ZWxOYW1lKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3RhdHVzOjIwMCxcbiAgICAgIGRhdGE6IHt0b2tlbiA6IHJlc3AudG9rZW4sY3VzdG9tZXJJZCA6IHJlc3AudXNlcklkfSxcbiAgICAgIGVycm9yOiBudWxsXG4gICAgfTtcbiAgICBjb25zb2xlLmxvZyhcImdlbmVyYXRlIHN1bXN1YiB0b2tlblwiLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgY29uc29sZS5sb2coXCJJbiBjYXRjaCBCbG9jayBFcnJvclwiLCBlcnIpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZXJyXG4gICAgfTtcbiAgfVxufTsiXX0=