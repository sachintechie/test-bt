"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("../db/dbFunctions");
const solanaTransfer_1 = require("../solana/solanaTransfer");
const handler = async (event) => {
    try {
        console.log(event);
        const isTransactionAlreadyExist = await (0, dbFunctions_1.getTransactionByTenantTransactionId)(event.arguments?.input?.tenantTransactionId, event.identity.resolverContext.id);
        if (isTransactionAlreadyExist == null || isTransactionAlreadyExist == undefined) {
            if (event.arguments?.input?.chainType === "Solana") {
                const data = await (0, solanaTransfer_1.solanaTransfer)(event.identity.resolverContext, event.arguments?.input?.senderWalletAddress, event.arguments?.input?.receiverWalletAddress, event.arguments?.input?.amount, event.arguments?.input?.symbol, event.headers?.identity, event.arguments?.input?.tenantUserId, event.arguments?.input?.chainType, event.arguments?.input?.tenantTransactionId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJhbnNmZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0cmFuc2Zlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxtREFBd0U7QUFFeEUsNkRBQTBEO0FBRW5ELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtJQUMxQyxJQUFJLENBQUM7UUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25CLE1BQU0seUJBQXlCLEdBQUcsTUFBTSxJQUFBLGlEQUFtQyxFQUN6RSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFDM0MsS0FBSyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUNsQyxDQUFDO1FBQ0YsSUFBSSx5QkFBeUIsSUFBSSxJQUFJLElBQUkseUJBQXlCLElBQUksU0FBUyxFQUFFLENBQUM7WUFDaEYsSUFBSSxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssUUFBUSxFQUFFLENBQUM7Z0JBQ25ELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBQSwrQkFBYyxFQUMvQixLQUFLLENBQUMsUUFBUSxDQUFDLGVBQXlCLEVBQ3hDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUMzQyxLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFDN0MsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUM5QixLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQzlCLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUN2QixLQUFLLENBQUMsU0FBUyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQ3BDLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFDakMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLENBQzVDLENBQUM7Z0JBRUYsTUFBTSxRQUFRLEdBQUc7b0JBQ2YsTUFBTSxFQUFFLElBQUksRUFBRSxXQUFXLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUc7b0JBQzdDLElBQUksRUFBRSxJQUFJLEVBQUUsV0FBVztvQkFDdkIsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLO2lCQUNuQixDQUFDO2dCQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUNoQyxPQUFPLFFBQVEsQ0FBQztZQUNsQixDQUFDO2lCQUFNLENBQUM7Z0JBQ04sT0FBTztvQkFDTCxNQUFNLEVBQUUsR0FBRztvQkFDWCxJQUFJLEVBQUUsSUFBSTtvQkFDVixLQUFLLEVBQUUseUJBQXlCO2lCQUNqQyxDQUFDO1lBQ0osQ0FBQztRQUNILENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTztnQkFDTCxNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsMkJBQTJCO2FBQ25DLENBQUM7UUFDSixDQUFDO0lBQ0gsQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRSxJQUFJO1lBQ1YsS0FBSyxFQUFFLEdBQUc7U0FDWCxDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQWxEVyxRQUFBLE9BQU8sV0FrRGxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0VHJhbnNhY3Rpb25CeVRlbmFudFRyYW5zYWN0aW9uSWQgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcbmltcG9ydCB7IHRlbmFudCB9IGZyb20gXCIuLi9kYi9tb2RlbHNcIjtcbmltcG9ydCB7IHNvbGFuYVRyYW5zZmVyIH0gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFUcmFuc2ZlclwiO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogYW55KSA9PiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coZXZlbnQpO1xuICAgIGNvbnN0IGlzVHJhbnNhY3Rpb25BbHJlYWR5RXhpc3QgPSBhd2FpdCBnZXRUcmFuc2FjdGlvbkJ5VGVuYW50VHJhbnNhY3Rpb25JZChcbiAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFRyYW5zYWN0aW9uSWQsXG4gICAgICBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQuaWRcbiAgICApO1xuICAgIGlmIChpc1RyYW5zYWN0aW9uQWxyZWFkeUV4aXN0ID09IG51bGwgfHwgaXNUcmFuc2FjdGlvbkFscmVhZHlFeGlzdCA9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmIChldmVudC5hcmd1bWVudHM/LmlucHV0Py5jaGFpblR5cGUgPT09IFwiU29sYW5hXCIpIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHNvbGFuYVRyYW5zZmVyKFxuICAgICAgICAgIGV2ZW50LmlkZW50aXR5LnJlc29sdmVyQ29udGV4dCBhcyB0ZW5hbnQsXG4gICAgICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uc2VuZGVyV2FsbGV0QWRkcmVzcyxcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py5yZWNlaXZlcldhbGxldEFkZHJlc3MsXG4gICAgICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uYW1vdW50LFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnN5bWJvbCxcbiAgICAgICAgICBldmVudC5oZWFkZXJzPy5pZGVudGl0eSxcbiAgICAgICAgICBldmVudC5hcmd1bWVudHM/LmlucHV0Py50ZW5hbnRVc2VySWQsXG4gICAgICAgICAgZXZlbnQuYXJndW1lbnRzPy5pbnB1dD8uY2hhaW5UeXBlLFxuICAgICAgICAgIGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ/LnRlbmFudFRyYW5zYWN0aW9uSWRcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgICBzdGF0dXM6IGRhdGE/LnRyYW5zYWN0aW9uICE9IG51bGwgPyAyMDAgOiA0MDAsXG4gICAgICAgICAgZGF0YTogZGF0YT8udHJhbnNhY3Rpb24sXG4gICAgICAgICAgZXJyb3I6IGRhdGE/LmVycm9yXG4gICAgICAgIH07XG4gICAgICAgIGNvbnNvbGUubG9nKFwiV2FsbGV0XCIsIHJlc3BvbnNlKTtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgICBkYXRhOiBudWxsLFxuICAgICAgICAgIGVycm9yOiBcIkNoYWluVHlwZSBub3Qgc3VwcG9ydGVkXCJcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICAgIGRhdGE6IG51bGwsXG4gICAgICAgIGVycm9yOiBcIlRyYW5zYWN0aW9uIGFscmVhZHkgZXhpc3RcIlxuICAgICAgfTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKFwiSW4gY2F0Y2ggQmxvY2sgRXJyb3JcIiwgZXJyKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiA0MDAsXG4gICAgICBkYXRhOiBudWxsLFxuICAgICAgZXJyb3I6IGVyclxuICAgIH07XG4gIH1cbn07XG4iXX0=