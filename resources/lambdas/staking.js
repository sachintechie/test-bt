"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const solanaStake_1 = require("../solana/solanaStake");
const handler = async (event) => {
    try {
        console.log(event);
        const isTransactionAlreadyExist = await (0, dbFunctions_1.getStakingTransactionByTenantTransactionId)(event.arguments?.input?.tenantTransactionId, event.identity.resolverContext.id);
        const masterValidatorNode = await (0, dbFunctions_1.getMasterValidatorNode)(event.arguments?.input?.chainType);
        if (masterValidatorNode == null || masterValidatorNode == undefined) {
            return {
                status: 400,
                data: null,
                error: "Master Validator Node not found"
            };
        }
        if (isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined) {
            if (event.arguments?.input?.chainType === "Solana") {
                const data = await (0, solanaStake_1.solanaStaking)(event.identity.resolverContext, event.arguments?.input?.senderWalletAddress, masterValidatorNode.validatornodeaddress || "", event.arguments?.input?.amount, event.arguments?.input?.symbol, event.headers?.identity, event.arguments?.input?.tenantUserId, event.arguments?.input?.chainType, event.arguments?.input?.tenantTransactionId, event.arguments?.input?.lockupExpirationTimestamp);
                const response = {
                    status: data?.transaction != null ? 200 : 400,
                    data: data?.transaction,
                    error: data?.error
                };
                console.log("Wallet", response);
                return response;
            }
            else {
                return {
                    status: 400,
                    data: null,
                    error: "ChainType not supported"
                };
            }
        }
        else {
            return {
                status: 400,
                data: null,
                error: "Transaction already exist"
            };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Rha2luZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0YWtpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbURBQXNHO0FBRXRHLHVEQUFzRDtBQUMvQyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixNQUFNLHlCQUF5QixHQUFHLE1BQU0sSUFBQSx3REFBMEMsRUFDaEYsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQzNDLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FDbEMsQ0FBQztRQUVGLE1BQU0sbUJBQW1CLEdBQUcsTUFBTSxJQUFBLG9DQUFzQixFQUFFLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzdGLElBQUcsbUJBQW1CLElBQUksSUFBSSxJQUFJLG1CQUFtQixJQUFJLFNBQVMsRUFBQyxDQUFDO1lBQ2xFLE9BQU87Z0JBQ0wsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsS0FBSyxFQUFFLGlDQUFpQzthQUN6QyxDQUFBO1FBQ0gsQ0FBQztRQUVELElBQUkseUJBQXlCLElBQUksSUFBSSxJQUFJLHlCQUF5QixJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2hGLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUEsMkJBQWEsRUFDOUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUF5QixFQUN4QyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFDM0MsbUJBQW1CLENBQUMsb0JBQW9CLElBQUksRUFBRSxFQUM5QyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQzlCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDOUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQ3ZCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFDcEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUNqQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFDM0MsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUseUJBQXlCLENBQ2xELENBQUM7Z0JBRUYsTUFBTSxRQUFRLEdBQUc7b0JBQ2YsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7b0JBQzdDLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVztvQkFDdkIsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLO2lCQUNuQixDQUFDO2dCQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLFFBQVEsQ0FBQztZQUNsQixDQUFDO2lCQUdJLENBQUM7Z0JBQ0osT0FBTztvQkFDTCxNQUFNLEVBQUUsR0FBRztvQkFDWCxJQUFJLEVBQUUsSUFBSTtvQkFDVixLQUFLLEVBQUUseUJBQXlCO2lCQUNqQyxDQUFDO1lBQ0osQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTztnQkFDTCxNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsMkJBQTJCO2FBQ25DLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWhFVyxRQUFBLE9BQU8sV0FnRWxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0U3Rha2luZ1RyYW5zYWN0aW9uQnlUZW5hbnRUcmFuc2FjdGlvbklkLGdldE1hc3RlclZhbGlkYXRvck5vZGUgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcbmltcG9ydCB7IHNvbGFuYVN0YWtpbmcgfSBmcm9tIFwiLi4vc29sYW5hL3NvbGFuYVN0YWtlXCI7XG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQpO1xuICAgIGNvbnN0IGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3QgPSBhd2FpdCBnZXRTdGFraW5nVHJhbnNhY3Rpb25CeVRlbmFudFRyYW5zYWN0aW9uSWQoXG4gICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py50ZW5hbnRUcmFuc2FjdGlvbklkLFxuICAgICAgZXZlbnQuaWRlbnRpdHkucmVzb2x2ZXJDb250ZXh0LmlkXG4gICAgKTtcblxuICAgIGNvbnN0IG1hc3RlclZhbGlkYXRvck5vZGUgPSBhd2FpdCBnZXRNYXN0ZXJWYWxpZGF0b3JOb2RlKCBldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGUpO1xuICAgIGlmKG1hc3RlclZhbGlkYXRvck5vZGUgPT0gbnVsbCB8fCBtYXN0ZXJWYWxpZGF0b3JOb2RlID09IHVuZGVmaW5lZCl7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiTWFzdGVyIFZhbGlkYXRvciBOb2RlIG5vdCBmb3VuZFwiXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3QgPT0gbnVsbCB8fCBpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0ID09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmNoYWluVHlwZSA9PT0gXCJTb2xhbmFcIikge1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgc29sYW5hU3Rha2luZyhcbiAgICAgICAgICBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQgYXMgdGVuYW50LFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnNlbmRlcldhbGxldEFkZHJlc3MsXG4gICAgICAgICAgbWFzdGVyVmFsaWRhdG9yTm9kZS52YWxpZGF0b3Jub2RlYWRkcmVzcyB8fCBcIlwiLFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmFtb3VudCxcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5zeW1ib2wsXG4gICAgICAgICAgZXZlbnQuaGVhZGVycz8uaWRlbnRpdHksXG4gICAgICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8udGVuYW50VXNlcklkLFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmNoYWluVHlwZSxcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py50ZW5hbnRUcmFuc2FjdGlvbklkLFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmxvY2t1cEV4cGlyYXRpb25UaW1lc3RhbXBcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgICBzdGF0dXM6IGRhdGE/LnRyYW5zYWN0aW9uICE9IG51bGwgPyAyMDAgOiA0MDAsXG4gICAgICAgICAgZGF0YTogZGF0YT8udHJhbnNhY3Rpb24sXG4gICAgICAgICAgZXJyb3I6IGRhdGE/LmVycm9yXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKFwiV2FsbGV0XCIsIHJlc3BvbnNlKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSBcblxuICAgICAgXG4gICAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIkNoYWluVHlwZSBub3Qgc3VwcG9ydGVkXCJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIGVycm9yOiBcIlRyYW5zYWN0aW9uIGFscmVhZHkgZXhpc3RcIlxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG4iXX0=