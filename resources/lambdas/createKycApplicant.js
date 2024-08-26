"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const sumsubFunctions_1 = require("../kyc/sumsubFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const applicant = await (0, sumsubFunctions_1.createApplicant)(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
        console.log("applicant", applicant);
        const response = {
            status: 200,
            data: applicant,
            error: ""
        };
        console.log("Create sumsub applicant", response);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlS3ljQXBwbGljYW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY3JlYXRlS3ljQXBwbGljYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDREQUF5RDtBQUVsRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLE9BQVksRUFBRSxFQUFFO0lBQ3hELElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTVCLE1BQU0sU0FBUyxHQUFHLE1BQU0sSUFBQSxpQ0FBZSxFQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztRQUMvRyxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBQyxTQUFTLENBQUMsQ0FBQztRQUVuQyxNQUFNLFFBQVEsR0FBRztZQUNmLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLFNBQVM7WUFDZixLQUFLLEVBQUUsRUFBRTtTQUNWLENBQUM7UUFDRixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWpELE9BQU8sUUFBUSxDQUFDO0lBQ2xCLENBQUM7SUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBdkJXLFFBQUEsT0FBTyxXQXVCbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVBcHBsaWNhbnQgfSBmcm9tIFwiLi4va3ljL3N1bXN1YkZ1bmN0aW9uc1wiO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55LCBjb250ZXh0OiBhbnkpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhldmVudCwgY29udGV4dCk7XG5cbiAgICBjb25zdCBhcHBsaWNhbnQgPSBhd2FpdCBjcmVhdGVBcHBsaWNhbnQoZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY3VzdG9tZXJJZCwgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8ubGV2ZWxOYW1lKTtcbiAgICBjb25zb2xlLmxvZyhcImFwcGxpY2FudFwiLGFwcGxpY2FudCk7XG5cbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgZGF0YTogYXBwbGljYW50LFxuICAgICAgZXJyb3I6IFwiXCJcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKFwiQ3JlYXRlIHN1bXN1YiBhcHBsaWNhbnRcIiwgcmVzcG9uc2UpO1xuXG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07Il19