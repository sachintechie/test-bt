"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const web3_js_1 = require("@solana/web3.js");
const solanaFunctions_1 = require("../solana/solanaFunctions");
const dbFunctions_1 = require("../db/dbFunctions");
const handler = async (event) => {
    try {
        console.log(event);
        const accounts = await (0, dbFunctions_1.getStakeAccounts)(event.arguments?.input?.walletAddress, event.identity.resolverContext.id);
        if (accounts != null) {
            const connection = await (0, solanaFunctions_1.getSolConnection)();
            for (const account of accounts) {
                const stakeAccountInfo = await (0, solanaFunctions_1.getStakeAccountInfo)(account.stakeaccountpubkey, connection);
                console.log("Current Stake Amount", stakeAccountInfo, stakeAccountInfo.currentStakeAmount);
                if (stakeAccountInfo.currentStakeAmount == null) {
                    account.amount = 0;
                }
                else {
                    account.amount = stakeAccountInfo.currentStakeAmount / web3_js_1.LAMPORTS_PER_SOL;
                }
            }
            return {
                status: 200,
                data: accounts,
                error: null
            };
        }
        else {
            return {
                status: 200,
                data: [],
                error: null
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdFN0YWtlQWNjb3VudHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsaXN0U3Rha2VBY2NvdW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2Q0FBbUQ7QUFDbkQsK0RBQWtGO0FBQ2xGLG1EQUFxRDtBQUU5QyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVuQixNQUFNLFFBQVEsR0FBRyxNQUFNLElBQUEsOEJBQWdCLEVBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ2xILElBQUcsUUFBUSxJQUFFLElBQUksRUFBQyxDQUFDO1lBQ2pCLE1BQU0sVUFBVSxHQUFHLE1BQU0sSUFBQSxrQ0FBZ0IsR0FBRSxDQUFDO1lBQzlDLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFLENBQUM7Z0JBQy9CLE1BQU0sZ0JBQWdCLEdBQUcsTUFBTSxJQUFBLHFDQUFtQixFQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFHM0YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2dCQUMzRixJQUFJLGdCQUFnQixDQUFDLGtCQUFrQixJQUFJLElBQUksRUFBRSxDQUFDO29CQUVoRCxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFDckIsQ0FBQztxQkFBSyxDQUFDO29CQUNMLE9BQU8sQ0FBQyxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsa0JBQWtCLEdBQUcsMEJBQWdCLENBQUM7Z0JBQzFFLENBQUM7WUFFSCxDQUFDO1lBQ0QsT0FBTztnQkFDTCxNQUFNLEVBQUUsR0FBRztnQkFDWCxJQUFJLEVBQUUsUUFBUTtnQkFDZCxLQUFLLEVBQUUsSUFBSTthQUNaLENBQUM7UUFDSixDQUFDO2FBQ0csQ0FBQztZQUNILE9BQU87Z0JBQ0wsTUFBTSxFQUFFLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLEVBQUU7Z0JBQ1IsS0FBSyxFQUFFLElBQUk7YUFDWixDQUFDO1FBRUosQ0FBQztJQUNELENBQUM7SUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxHQUFHO1NBQ1gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUExQ1csUUFBQSxPQUFPLFdBMENsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExBTVBPUlRTX1BFUl9TT0wgfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5pbXBvcnQgeyBnZXRTb2xDb25uZWN0aW9uLCBnZXRTdGFrZUFjY291bnRJbmZvIH0gZnJvbSBcIi4uL3NvbGFuYS9zb2xhbmFGdW5jdGlvbnNcIjtcbmltcG9ydCB7IGdldFN0YWtlQWNjb3VudHMgfSBmcm9tIFwiLi4vZGIvZGJGdW5jdGlvbnNcIjtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50KTtcblxuICAgIGNvbnN0IGFjY291bnRzID0gYXdhaXQgZ2V0U3Rha2VBY2NvdW50cyhldmVudC5hcmd1bWVudHM/LmlucHV0Py53YWxsZXRBZGRyZXNzLCBldmVudC5pZGVudGl0eS5yZXNvbHZlckNvbnRleHQuaWQpO1xuICAgIGlmKGFjY291bnRzIT1udWxsKXtcbiAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRTb2xDb25uZWN0aW9uKCk7XG4gICAgZm9yIChjb25zdCBhY2NvdW50IG9mIGFjY291bnRzKSB7XG4gICAgICBjb25zdCBzdGFrZUFjY291bnRJbmZvID0gYXdhaXQgZ2V0U3Rha2VBY2NvdW50SW5mbyhhY2NvdW50LnN0YWtlYWNjb3VudHB1YmtleSwgY29ubmVjdGlvbik7XG5cblxuICAgICAgY29uc29sZS5sb2coXCJDdXJyZW50IFN0YWtlIEFtb3VudFwiLCBzdGFrZUFjY291bnRJbmZvLCBzdGFrZUFjY291bnRJbmZvLmN1cnJlbnRTdGFrZUFtb3VudCk7XG4gICAgICBpZiAoc3Rha2VBY2NvdW50SW5mby5jdXJyZW50U3Rha2VBbW91bnQgPT0gbnVsbCkge1xuXG4gICAgICAgIGFjY291bnQuYW1vdW50ID0gMDtcbiAgICAgIH0gZWxzZXtcbiAgICAgICAgYWNjb3VudC5hbW91bnQgPSBzdGFrZUFjY291bnRJbmZvLmN1cnJlbnRTdGFrZUFtb3VudCAvIExBTVBPUlRTX1BFUl9TT0w7XG4gICAgICB9XG4gICAgIFxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiBhY2NvdW50cyxcbiAgICAgIGVycm9yOiBudWxsXG4gICAgfTtcbiAgfVxuICBlbHNle1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDIwMCxcbiAgICAgIGRhdGE6IFtdLFxuICAgICAgZXJyb3I6IG51bGxcbiAgICB9O1xuICBcbiAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59O1xuXG4iXX0=