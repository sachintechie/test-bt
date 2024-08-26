"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const solanaTransfer_1 = require("../solana/solanaTransfer");
const utils_1 = require("../utils/utils");
const handler = async (event) => {
    try {
        console.log(event);
        const isTransactionAlreadyExist = await (0, dbFunctions_1.getTransactionByTenantTransactionId)(event.arguments?.input?.tenantTransactionId, event.identity.resolverContext.id);
        if (!isTransactionAlreadyExist) {
            if (event.arguments?.input?.chainType === "Solana") {
                const receiverWallet = await (0, dbFunctions_1.getMasterWalletAddress)(event.arguments?.input?.chainType, event.identity.resolverContext.id, event.arguments?.input?.symbol);
                (0, utils_1.logWithTrace)("Receiver Wallet", receiverWallet);
                if (receiverWallet != null) {
                    const data = await (0, solanaTransfer_1.solanaTransfer)(event.identity.resolverContext, event.arguments?.input?.senderWalletAddress, receiverWallet.walletaddress, event.arguments?.input?.amount, event.arguments?.input?.symbol, event.headers?.identity, event.arguments?.input?.tenantUserId, event.arguments?.input?.chainType, event.arguments?.input?.tenantTransactionId);
                    const response = {
                        status: data?.transaction != null ? 200 : 400,
                        data: data?.transaction,
                        error: data?.error
                    };
                    (0, utils_1.logWithTrace)("Wallet", response);
                    return response;
                }
                else {
                    return {
                        status: 400,
                        data: null,
                        error: "Master Wallet not found"
                    };
                }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzdGVyVHJhbnNmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtYXN0ZXJUcmFuc2Zlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFBZ0c7QUFFaEcsNkRBQTBEO0FBQzFELDBDQUE0QztBQUVyQyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixNQUFNLHlCQUF5QixHQUFHLE1BQU0sSUFBQSxpREFBbUMsRUFDekUsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQzNDLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FDbEMsQ0FBQztRQUNGLElBQUksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO1lBQy9CLElBQUksS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUNuRCxNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUEsb0NBQXNCLEVBQ2pELEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFDakMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxFQUNqQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQy9CLENBQUM7Z0JBQ0YsSUFBQSxvQkFBWSxFQUFDLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxDQUFDO2dCQUNoRCxJQUFJLGNBQWMsSUFBSSxJQUFJLEVBQUUsQ0FBQztvQkFDM0IsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLCtCQUFjLEVBQy9CLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBeUIsRUFDeEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQzNDLGNBQWMsQ0FBQyxhQUF1QixFQUN0QyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQzlCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDOUIsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQ3ZCLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFDcEMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUNqQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsQ0FDNUMsQ0FBQztvQkFFRixNQUFNLFFBQVEsR0FBRzt3QkFDZixNQUFNLEVBQUUsSUFBSSxFQUFFLFdBQVcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRzt3QkFDN0MsSUFBSSxFQUFFLElBQUksRUFBRSxXQUFXO3dCQUN2QixLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUs7cUJBQ25CLENBQUM7b0JBQ0YsSUFBQSxvQkFBWSxFQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztvQkFDakMsT0FBTyxRQUFRLENBQUM7Z0JBQ2xCLENBQUM7cUJBQU0sQ0FBQztvQkFDTixPQUFPO3dCQUNMLE1BQU0sRUFBRSxHQUFHO3dCQUNYLElBQUksRUFBRSxJQUFJO3dCQUNWLEtBQUssRUFBRSx5QkFBeUI7cUJBQ2pDLENBQUM7Z0JBQ0osQ0FBQztZQUNILENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPO29CQUNMLE1BQU0sRUFBRSxHQUFHO29CQUNYLElBQUksRUFBRSxJQUFJO29CQUNWLEtBQUssRUFBRSx5QkFBeUI7aUJBQ2pDLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixPQUFPO2dCQUNMLE1BQU0sRUFBRSxHQUFHO2dCQUNYLElBQUksRUFBRSxJQUFJO2dCQUNWLEtBQUssRUFBRSwyQkFBMkI7YUFDbkMsQ0FBQztRQUNKLENBQUM7SUFDSCxDQUFDO0lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDekMsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsR0FBRztTQUNYLENBQUM7SUFDSixDQUFDO0FBQ0gsQ0FBQyxDQUFDO0FBaEVXLFFBQUEsT0FBTyxXQWdFbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRNYXN0ZXJXYWxsZXRBZGRyZXNzLCBnZXRUcmFuc2FjdGlvbkJ5VGVuYW50VHJhbnNhY3Rpb25JZCB9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgdGVuYW50IH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHsgc29sYW5hVHJhbnNmZXIgfSBmcm9tIFwiLi4vc29sYW5hL3NvbGFuYVRyYW5zZmVyXCI7XG5pbXBvcnQge2xvZ1dpdGhUcmFjZX0gZnJvbSBcIi4uL3V0aWxzL3V0aWxzXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnkpID0+IHtcbiAgdHJ5IHtcbiAgICBjb25zb2xlLmxvZyhldmVudCk7XG4gICAgY29uc3QgaXNUcmFuc2FjdGlvbkFscmVhZHlFeGlzdCA9IGF3YWl0IGdldFRyYW5zYWN0aW9uQnlUZW5hbnRUcmFuc2FjdGlvbklkKFxuICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8udGVuYW50VHJhbnNhY3Rpb25JZCxcbiAgICAgIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dC5pZFxuICAgICk7XG4gICAgaWYgKCFpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0KSB7XG4gICAgICBpZiAoZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY2hhaW5UeXBlID09PSBcIlNvbGFuYVwiKSB7XG4gICAgICAgIGNvbnN0IHJlY2VpdmVyV2FsbGV0ID0gYXdhaXQgZ2V0TWFzdGVyV2FsbGV0QWRkcmVzcyhcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGUsXG4gICAgICAgICAgZXZlbnQuaWRlbnRpdHkucmVzb2x2ZXJDb250ZXh0LmlkLFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnN5bWJvbFxuICAgICAgICApO1xuICAgICAgICBsb2dXaXRoVHJhY2UoXCJSZWNlaXZlciBXYWxsZXRcIiwgcmVjZWl2ZXJXYWxsZXQpO1xuICAgICAgICBpZiAocmVjZWl2ZXJXYWxsZXQgIT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBzb2xhbmFUcmFuc2ZlcihcbiAgICAgICAgICAgIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQsXG4gICAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5zZW5kZXJXYWxsZXRBZGRyZXNzLFxuICAgICAgICAgICAgcmVjZWl2ZXJXYWxsZXQud2FsbGV0YWRkcmVzcyBhcyBzdHJpbmcsXG4gICAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5hbW91bnQsXG4gICAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5zeW1ib2wsXG4gICAgICAgICAgICBldmVudC5oZWFkZXJzPy5pZGVudGl0eSxcbiAgICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFVzZXJJZCxcbiAgICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmNoYWluVHlwZSxcbiAgICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFRyYW5zYWN0aW9uSWRcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgICBzdGF0dXM6IGRhdGE/LnRyYW5zYWN0aW9uICE9IG51bGwgPyAyMDAgOiA0MDAsXG4gICAgICAgICAgICBkYXRhOiBkYXRhPy50cmFuc2FjdGlvbixcbiAgICAgICAgICAgIGVycm9yOiBkYXRhPy5lcnJvclxuICAgICAgICAgIH07XG4gICAgICAgICAgbG9nV2l0aFRyYWNlKFwiV2FsbGV0XCIsIHJlc3BvbnNlKTtcbiAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICAgIGVycm9yOiBcIk1hc3RlciBXYWxsZXQgbm90IGZvdW5kXCJcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgICAgZXJyb3I6IFwiQ2hhaW5UeXBlIG5vdCBzdXBwb3J0ZWRcIlxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiVHJhbnNhY3Rpb24gYWxyZWFkeSBleGlzdFwiXG4gICAgICB9O1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coXCJJbiBjYXRjaCBCbG9jayBFcnJvclwiLCBlcnIpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDQwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZXJyXG4gICAgfTtcbiAgfVxufTtcbiJdfQ==