"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const sumsubFunctions_1 = require("../kyc/sumsubFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        const customerKyc = await (0, dbFunctions_1.getCustomerKycByTenantId)(event.arguments?.input?.customerId, event.identity.resolverContext.id);
        console.log("customerKyc", customerKyc);
        if (customerKyc == null || customerKyc == undefined) {
            const sumsubResponse = await (0, sumsubFunctions_1.createApplicant)(event.arguments?.input?.customerId, event.arguments?.input?.levelName);
            console.log("sumsubResponse", sumsubResponse);
            if (sumsubResponse.errorCode == null) {
                const userKyc = await (0, dbFunctions_1.insertCustomerKyc)(sumsubResponse, "SUMSUB", event.identity.resolverContext.id);
                const response = {
                    status: 200,
                    data: userKyc,
                    error: null
                };
                console.log("getApplicantDataByExternalId", response);
                return response;
            }
            else {
                const response = {
                    status: 400,
                    data: null,
                    error: sumsubResponse
                };
                console.log("getApplicantDataByExternalId", response);
                return response;
            }
        }
        else {
            const response = {
                status: 200,
                data: customerKyc,
                error: null
            };
            console.log("getApplicantDataByExternalId", response);
            return response;
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0S3ljQXBwbGljYW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0S3ljQXBwbGljYW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUFnRztBQUNoRyw0REFBeUQ7QUFFbEQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN4RCxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztRQUU1QixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsc0NBQXdCLEVBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3pILE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3hDLElBQUksV0FBVyxJQUFJLElBQUksSUFBSSxXQUFXLElBQUksU0FBUyxFQUFFLENBQUM7WUFDcEQsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFBLGlDQUFlLEVBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3BILE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLENBQUM7WUFDOUMsSUFBRyxjQUFjLENBQUMsU0FBUyxJQUFJLElBQUksRUFBQyxDQUFDO2dCQUNyQyxNQUFNLE9BQU8sR0FBRyxNQUFNLElBQUEsK0JBQWlCLEVBQUMsY0FBYyxFQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQ2pHLENBQUM7Z0JBQ0YsTUFBTSxRQUFRLEdBQUc7b0JBQ2YsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsSUFBSSxFQUFFLE9BQU87b0JBQ2IsS0FBSyxFQUFFLElBQUk7aUJBQ1osQ0FBQztnQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLDhCQUE4QixFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUV0RCxPQUFPLFFBQVEsQ0FBQztZQUNsQixDQUFDO2lCQUNHLENBQUM7Z0JBQ0gsTUFBTSxRQUFRLEdBQUc7b0JBQ2YsTUFBTSxFQUFFLEdBQUc7b0JBQ1gsSUFBSSxFQUFFLElBQUk7b0JBQ1YsS0FBSyxFQUFFLGNBQWM7aUJBQ3RCLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFFdEQsT0FBTyxRQUFRLENBQUE7WUFDakIsQ0FBQztRQUNELENBQUM7YUFDRyxDQUFDO1lBQ0wsTUFBTSxRQUFRLEdBQUc7Z0JBQ2YsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLEtBQUssRUFBRSxJQUFJO2FBQ1osQ0FBQztZQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFFdEQsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQztJQUNELENBQUM7SUFBQyxPQUFPLEdBQVEsRUFBRSxDQUFDO1FBQ2xCLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBbERXLFFBQUEsT0FBTyxXQWtEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRDdXN0b21lckt5YywgZ2V0Q3VzdG9tZXJLeWNCeVRlbmFudElkLCBpbnNlcnRDdXN0b21lckt5YyB9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgY3JlYXRlQXBwbGljYW50IH0gZnJvbSBcIi4uL2t5Yy9zdW1zdWJGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSwgY29udGV4dDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQsIGNvbnRleHQpO1xuXG4gICAgY29uc3QgY3VzdG9tZXJLeWMgPSBhd2FpdCBnZXRDdXN0b21lckt5Y0J5VGVuYW50SWQoZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY3VzdG9tZXJJZCxldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQuaWQpO1xuICAgIGNvbnNvbGUubG9nKFwiY3VzdG9tZXJLeWNcIiwgY3VzdG9tZXJLeWMpO1xuICAgIGlmIChjdXN0b21lckt5YyA9PSBudWxsIHx8IGN1c3RvbWVyS3ljID09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3Qgc3Vtc3ViUmVzcG9uc2UgPSBhd2FpdCBjcmVhdGVBcHBsaWNhbnQoZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY3VzdG9tZXJJZCwgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8ubGV2ZWxOYW1lKTtcbiAgICAgIGNvbnNvbGUubG9nKFwic3Vtc3ViUmVzcG9uc2VcIiwgc3Vtc3ViUmVzcG9uc2UpO1xuICAgICAgaWYoc3Vtc3ViUmVzcG9uc2UuZXJyb3JDb2RlID09IG51bGwpe1xuICAgICAgY29uc3QgdXNlckt5YyA9IGF3YWl0IGluc2VydEN1c3RvbWVyS3ljKHN1bXN1YlJlc3BvbnNlLFwiU1VNU1VCXCIsIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dC5pZFxuICAgICAgKTtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBzdGF0dXM6IDIwMCxcbiAgICAgICAgZGF0YTogdXNlckt5YyxcbiAgICAgICAgZXJyb3I6IG51bGxcbiAgICAgIH07XG4gICAgICBjb25zb2xlLmxvZyhcImdldEFwcGxpY2FudERhdGFCeUV4dGVybmFsSWRcIiwgcmVzcG9uc2UpO1xuICBcbiAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgZXJyb3I6IHN1bXN1YlJlc3BvbnNlXG4gICAgICB9O1xuICAgICAgY29uc29sZS5sb2coXCJnZXRBcHBsaWNhbnREYXRhQnlFeHRlcm5hbElkXCIsIHJlc3BvbnNlKTtcbiAgXG4gICAgICByZXR1cm4gcmVzcG9uc2VcbiAgICB9XG4gICAgfVxuICAgIGVsc2V7XG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGRhdGE6IGN1c3RvbWVyS3ljLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKFwiZ2V0QXBwbGljYW50RGF0YUJ5RXh0ZXJuYWxJZFwiLCByZXNwb25zZSk7XG5cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH1cbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuIl19