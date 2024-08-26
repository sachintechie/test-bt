"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const solanaUnstake_1 = require("../solana/solanaUnstake");
const handler = async (event) => {
    try {
        console.log(event);
        const isTransactionAlreadyExist = await (0, dbFunctions_1.getStakeAccountById)(event.arguments?.input?.stakeAccountId, event.identity.resolverContext.id);
        if (isTransactionAlreadyExist != null) {
            if (event.arguments?.input?.chainType === "Solana") {
                console.log("Inside Solana", isTransactionAlreadyExist);
                const data = await (0, solanaUnstake_1.solanaUnStaking)(event.identity.resolverContext, event.arguments?.input?.stakeAccountId, isTransactionAlreadyExist.walletaddress, isTransactionAlreadyExist.stakeaccountpubkey, event.arguments?.input?.amount, isTransactionAlreadyExist.symbol, event.headers?.identity, isTransactionAlreadyExist.tenantuserid, event.arguments?.input?.chainType, isTransactionAlreadyExist.tenanttransactionid);
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
                error: "Transaction not found"
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW5zdGFraW5nLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidW5zdGFraW5nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1EQUF3RDtBQUV4RCwyREFBMEQ7QUFDbkQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxFQUFFO0lBQzFDLElBQUksQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkIsTUFBTSx5QkFBeUIsR0FBRyxNQUFNLElBQUEsaUNBQW1CLEVBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZJLElBQUkseUJBQXlCLElBQUksSUFBSSxFQUFFLENBQUM7WUFDdEMsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLHlCQUF5QixDQUFDLENBQUM7Z0JBQ3hELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSwrQkFBZSxFQUNoQyxLQUFLLENBQUMsUUFBUSxDQUFDLGVBQXlCLEVBQ3hDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFDdEMseUJBQXlCLENBQUMsYUFBYSxFQUN2Qyx5QkFBeUIsQ0FBQyxrQkFBa0IsRUFDNUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUM5Qix5QkFBeUIsQ0FBQyxNQUFNLEVBQ2hDLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUN2Qix5QkFBeUIsQ0FBQyxZQUFZLEVBQ3RDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFDakMseUJBQXlCLENBQUMsbUJBQW1CLENBQzlDLENBQUM7Z0JBRUYsTUFBTSxRQUFRLEdBQUc7b0JBQ2YsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7b0JBQzdDLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVztvQkFDdkIsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLO2lCQUNuQixDQUFDO2dCQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLFFBQVEsQ0FBQztZQUNsQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTztvQkFDTCxNQUFNLEVBQUUsR0FBRztvQkFDWCxJQUFJLEVBQUUsSUFBSTtvQkFDVixLQUFLLEVBQUUseUJBQXlCO2lCQUNqQyxDQUFDO1lBQ0osQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTztnQkFDTCxNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsdUJBQXVCO2FBQy9CLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWpEVyxRQUFBLE9BQU8sV0FpRGxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0U3Rha2VBY2NvdW50QnlJZCB9IGZyb20gXCIuLi9kYi9kYkZ1bmN0aW9uc1wiO1xuaW1wb3J0IHsgdGVuYW50IH0gZnJvbSBcIi4uL2RiL21vZGVsc1wiO1xuaW1wb3J0IHsgc29sYW5hVW5TdGFraW5nIH0gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFVbnN0YWtlXCI7XG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQpO1xuICAgIGNvbnN0IGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3QgPSBhd2FpdCBnZXRTdGFrZUFjY291bnRCeUlkKGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnN0YWtlQWNjb3VudElkLCBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQuaWQpO1xuICAgIGlmIChpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0ICE9IG51bGwpIHtcbiAgICAgIGlmIChldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGUgPT09IFwiU29sYW5hXCIpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJJbnNpZGUgU29sYW5hXCIsIGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3QpO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgc29sYW5hVW5TdGFraW5nKFxuICAgICAgICAgIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQsXG4gICAgICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uc3Rha2VBY2NvdW50SWQsXG4gICAgICAgICAgaXNUcmFuc2FjdGlvbkFscmVhZHlFeGlzdC53YWxsZXRhZGRyZXNzLFxuICAgICAgICAgIGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3Quc3Rha2VhY2NvdW50cHVia2V5LFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LmFtb3VudCxcbiAgICAgICAgICBpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0LnN5bWJvbCxcbiAgICAgICAgICBldmVudC5oZWFkZXJzPy5pZGVudGl0eSxcbiAgICAgICAgICBpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0LnRlbmFudHVzZXJpZCxcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGUsXG4gICAgICAgICAgaXNUcmFuc2FjdGlvbkFscmVhZHlFeGlzdC50ZW5hbnR0cmFuc2FjdGlvbmlkXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICAgICAgc3RhdHVzOiBkYXRhPy50cmFuc2FjdGlvbiAhPSBudWxsID8gMjAwIDogNDAwLFxuICAgICAgICAgIGRhdGE6IGRhdGE/LnRyYW5zYWN0aW9uLFxuICAgICAgICAgIGVycm9yOiBkYXRhPy5lcnJvclxuICAgICAgICB9O1xuICAgICAgICBjb25zb2xlLmxvZyhcIldhbGxldFwiLCByZXNwb25zZSk7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgICBlcnJvcjogXCJDaGFpblR5cGUgbm90IHN1cHBvcnRlZFwiXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogNDAwLFxuICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICBlcnJvcjogXCJUcmFuc2FjdGlvbiBub3QgZm91bmRcIlxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG4iXX0=