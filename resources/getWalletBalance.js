"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dbFunctions_1 = require("./dbFunctions");
const web3_js_1 = require("@solana/web3.js");
// const SOLANA_RPC_PROVIDER = "https://api.devnet.solana.com";
const SOLANA_RPC_PROVIDER = "https://solana-devnet.g.alchemy.com/v2/JGP5GfDvdIUjAnAxrfaQVQbNHC9l0dMS";
const handler = async (event) => {
    try {
        console.log(event);
        const wallet = await getBalance(event.identity, event.arguments?.walletAddress);
        return {
            status: 200,
            body: {
                data: wallet,
                error: null,
            },
        };
    }
    catch (err) {
        console.log("In catch Block Error", err);
        return {
            status: 400,
            body: {
                data: null,
                error: err,
            },
        };
    }
};
exports.handler = handler;
async function getBalance(tenant, walletAddress) {
    console.log("Wallet Address", walletAddress);
    try {
        const wallet = await (0, dbFunctions_1.getWalletAndTokenByWalletAddress)(walletAddress, tenant);
        let balance = 0;
        console.log(wallet, "Wallet");
        for (const token of wallet) {
            if (token.chaintype === "SOL") {
                balance = await getSolBalance(walletAddress);
                token.balance = balance;
            }
            else {
                balance = await getSplTokenBalance(walletAddress, token.contractaddress ? token.contractaddress : "");
                token.balance = balance;
            }
        }
        ;
        return wallet;
    }
    catch (err) {
        console.log(err);
        throw err;
    }
}
async function getSolBalance(address) {
    try {
        console.log("Address", address);
        const pubkey = new web3_js_1.PublicKey(address);
        console.log("pubkey", pubkey);
        const connection = await getSolConnection();
        console.log(connection, "connection");
        console.log(await connection.getBalance(pubkey), "connection");
        const balance = (await connection.getBalance(pubkey)) / web3_js_1.LAMPORTS_PER_SOL;
        console.log("Balance", balance);
        return balance;
    }
    catch (err) {
        console.log(err);
        //throw err;
        return 0;
    }
}
async function getSplTokenBalance(wallet, contractAddress) {
    try {
        wallet = "9CTUUQ17e2nghqswwLkNqazUw6pVDvUaWNo4wjWCPSwz";
        if (contractAddress === "") {
            return 0; //no contract address
        }
        else {
            const solanaConnection = await getSolConnection();
            const filters = [
                {
                    dataSize: 165, //size of account (bytes)
                },
                {
                    memcmp: {
                        offset: 32, //location of our query in the account (bytes)
                        bytes: wallet, //our search criteria, a base58 encoded string
                    },
                },
                {
                    memcmp: {
                        offset: 0, //number of bytes
                        bytes: contractAddress, //base58 encoded string
                    },
                },
            ];
            const accounts = await solanaConnection.getParsedProgramAccounts(new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
                filters: filters,
            });
            console.log(`Found ${accounts.length} token account(s) for wallet ${wallet}.`);
            const parsedAccountInfo = accounts[0].account.data;
            console.log(parsedAccountInfo, "parsedAccountInfo");
            //const mintAddress: string = parsedAccountInfo["parsed"]["info"]["mint"];
            const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];
            return tokenBalance;
        }
    }
    catch (err) {
        console.log(err);
        return 0;
    }
}
async function getSolConnection() {
    // const connection = new Connection(SOLANA_RPC_PROVIDER, "confirmed");
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)("devnet"), "confirmed");
    return connection;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0V2FsbGV0QmFsYW5jZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldFdhbGxldEJhbGFuY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsK0NBQWlFO0FBQ2pFLDZDQUt5QjtBQUV6QiwrREFBK0Q7QUFDL0QsTUFBTSxtQkFBbUIsR0FBRyx5RUFBeUUsQ0FBQTtBQUU5RixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBVSxFQUFFLEVBQUU7SUFDMUMsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVuQixNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FDN0IsS0FBSyxDQUFDLFFBQWtCLEVBQ3hCLEtBQUssQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUMvQixDQUFDO1FBRUYsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHO1lBQ1gsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxNQUFNO2dCQUNaLEtBQUssRUFBRSxJQUFJO2FBQ1o7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsR0FBRyxDQUFDLHNCQUFzQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ3pDLE9BQU87WUFDTCxNQUFNLEVBQUUsR0FBRztZQUNYLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsSUFBSTtnQkFDVixLQUFLLEVBQUUsR0FBRzthQUNYO1NBQ0YsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUExQlcsUUFBQSxPQUFPLFdBMEJsQjtBQUVGLEtBQUssVUFBVSxVQUFVLENBQ3ZCLE1BQWMsRUFDZCxhQUFxQjtJQUNyQixPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRTdDLElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSw4Q0FBZ0MsRUFDbkQsYUFBYSxFQUNiLE1BQU0sQ0FD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LHdCQUF3QixDQUM5RCxJQUFJLG1CQUFTLENBQUMsNkNBQTZDLENBQUMsRUFDNUQ7Z0JBQ0UsT0FBTyxFQUFFLE9BQU87YUFDakIsQ0FDRixDQUFDO1lBQ0YsT0FBTyxDQUFDLEdBQUcsQ0FDVCxTQUFTLFFBQVEsQ0FBQyxNQUFNLGdDQUFnQyxNQUFNLEdBQUcsQ0FDbEUsQ0FBQztZQUNGLE1BQU0saUJBQWlCLEdBQVEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1lBQ3BELDBFQUEwRTtZQUMxRSxNQUFNLFlBQVksR0FDaEIsaUJBQWlCLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDakUsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQztJQUNILENBQUM7SUFDRCxPQUFNLEdBQUcsRUFBQyxDQUFDO1FBQ1QsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqQixPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7QUFDRCxDQUFDO0FBRUQsS0FBSyxVQUFVLGdCQUFnQjtJQUM3Qix1RUFBdUU7SUFDdkUsTUFBTSxVQUFVLEdBQUcsSUFBSSxvQkFBVSxDQUFDLElBQUEsdUJBQWEsRUFBQyxRQUFRLENBQUMsRUFBQyxXQUFXLENBQUMsQ0FBQztJQUN2RSxPQUFPLFVBQVUsQ0FBQztBQUNwQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY3MgZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xyXG5pbXBvcnQgeyB0ZW5hbnQgfSBmcm9tIFwiLi9tb2RlbHNcIjtcclxuaW1wb3J0IHsgZ2V0V2FsbGV0QW5kVG9rZW5CeVdhbGxldEFkZHJlc3MgfSBmcm9tIFwiLi9kYkZ1bmN0aW9uc1wiO1xyXG5pbXBvcnQge1xyXG4gIENvbm5lY3Rpb24sXHJcbiAgTEFNUE9SVFNfUEVSX1NPTCxcclxuICBQdWJsaWNLZXksXHJcbiAgR2V0UHJvZ3JhbUFjY291bnRzRmlsdGVyLGNsdXN0ZXJBcGlVcmwsXHJcbn0gZnJvbSBcIkBzb2xhbmEvd2ViMy5qc1wiO1xyXG5cclxuLy8gY29uc3QgU09MQU5BX1JQQ19QUk9WSURFUiA9IFwiaHR0cHM6Ly9hcGkuZGV2bmV0LnNvbGFuYS5jb21cIjtcclxuY29uc3QgU09MQU5BX1JQQ19QUk9WSURFUiA9IFwiaHR0cHM6Ly9zb2xhbmEtZGV2bmV0LmcuYWxjaGVteS5jb20vdjIvSkdQNUdmRHZkSVVqQW5BeHJmYVFWUWJOSEM5bDBkTVNcIlxyXG5cclxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zb2xlLmxvZyhldmVudCk7XHJcblxyXG4gICAgY29uc3Qgd2FsbGV0ID0gYXdhaXQgZ2V0QmFsYW5jZShcclxuICAgICAgZXZlbnQuaWRlbnRpdHkgYXMgdGVuYW50LFxyXG4gICAgICBldmVudC5hcmd1bWVudHM/LndhbGxldEFkZHJlc3NcclxuICAgICk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzOiAyMDAsXHJcbiAgICAgIGJvZHk6IHtcclxuICAgICAgICBkYXRhOiB3YWxsZXQsXHJcbiAgICAgICAgZXJyb3I6IG51bGwsXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5sb2coXCJJbiBjYXRjaCBCbG9jayBFcnJvclwiLCBlcnIpO1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgc3RhdHVzOiA0MDAsXHJcbiAgICAgIGJvZHk6IHtcclxuICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgICAgIGVycm9yOiBlcnIsXHJcbiAgICAgIH0sXHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldEJhbGFuY2UoXHJcbiAgdGVuYW50OiB0ZW5hbnQsXHJcbiAgd2FsbGV0QWRkcmVzczogc3RyaW5nKSB7XHJcbiAgY29uc29sZS5sb2coXCJXYWxsZXQgQWRkcmVzc1wiLCB3YWxsZXRBZGRyZXNzKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHdhbGxldCA9IGF3YWl0IGdldFdhbGxldEFuZFRva2VuQnlXYWxsZXRBZGRyZXNzKFxyXG4gICAgICB3YWxsZXRBZGRyZXNzLFxyXG4gICAgICB0ZW5hbnRcclxuICAgICk7XHJcbiAgICBsZXQgYmFsYW5jZSA9IDA7XHJcbiAgICBjb25zb2xlLmxvZyh3YWxsZXQsIFwiV2FsbGV0XCIpO1xyXG4gICAgZm9yKGNvbnN0IHRva2VuIG9mIHdhbGxldCl7XHJcbiAgICAgIGlmICh0b2tlbi5jaGFpbnR5cGUgPT09IFwiU09MXCIpIHtcclxuICAgICAgICBiYWxhbmNlID0gYXdhaXQgZ2V0U29sQmFsYW5jZSh3YWxsZXRBZGRyZXNzKTtcclxuICAgICAgICB0b2tlbi5iYWxhbmNlID0gYmFsYW5jZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBiYWxhbmNlID0gYXdhaXQgZ2V0U3BsVG9rZW5CYWxhbmNlKFxyXG4gICAgICAgICAgd2FsbGV0QWRkcmVzcyxcclxuICAgICAgICAgIHRva2VuLmNvbnRyYWN0YWRkcmVzcyA/IHRva2VuLmNvbnRyYWN0YWRkcmVzcyA6IFwiXCJcclxuICAgICAgICApO1xyXG4gICAgICAgIHRva2VuLmJhbGFuY2UgPSBiYWxhbmNlO1xyXG4gICAgICB9XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gd2FsbGV0O1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgIHRocm93IGVycjtcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdldFNvbEJhbGFuY2UoYWRkcmVzczogc3RyaW5nKSB7XHJcbiAgdHJ5IHtcclxuICAgIGNvbnNvbGUubG9nKFwiQWRkcmVzc1wiLCBhZGRyZXNzKTtcclxuICAgIGNvbnN0IHB1YmtleSA9IG5ldyBQdWJsaWNLZXkoYWRkcmVzcyk7XHJcbiAgICBjb25zb2xlLmxvZyhcInB1YmtleVwiLCBwdWJrZXkpO1xyXG5cclxuICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBnZXRTb2xDb25uZWN0aW9uKCk7XHJcbiAgICBjb25zb2xlLmxvZyhjb25uZWN0aW9uLCBcImNvbm5lY3Rpb25cIik7XHJcbiAgICBjb25zb2xlLmxvZyhhd2FpdCBjb25uZWN0aW9uLmdldEJhbGFuY2UocHVia2V5KSwgXCJjb25uZWN0aW9uXCIpO1xyXG5cclxuICAgIGNvbnN0IGJhbGFuY2UgPSAoYXdhaXQgY29ubmVjdGlvbi5nZXRCYWxhbmNlKHB1YmtleSkpIC8gTEFNUE9SVFNfUEVSX1NPTDtcclxuICAgIGNvbnNvbGUubG9nKFwiQmFsYW5jZVwiLCBiYWxhbmNlKTtcclxuICAgIHJldHVybiBiYWxhbmNlO1xyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5sb2coZXJyKTtcclxuICAgIC8vdGhyb3cgZXJyO1xyXG4gICAgcmV0dXJuIDA7XHJcbiAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBnZXRTcGxUb2tlbkJhbGFuY2Uod2FsbGV0OiBzdHJpbmcsIGNvbnRyYWN0QWRkcmVzczogc3RyaW5nKSB7XHJcbiAgICB0cnl7XHJcbiAgXHJcbiAgd2FsbGV0ID0gXCI5Q1RVVVExN2UybmdocXN3d0xrTnFhelV3NnBWRHZVYVdObzR3aldDUFN3elwiO1xyXG4gIGlmIChjb250cmFjdEFkZHJlc3MgPT09IFwiXCIpIHtcclxuICAgIHJldHVybiAwOyAvL25vIGNvbnRyYWN0IGFkZHJlc3NcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc3Qgc29sYW5hQ29ubmVjdGlvbiA9IGF3YWl0IGdldFNvbENvbm5lY3Rpb24oKTtcclxuICAgIGNvbnN0IGZpbHRlcnM6IEdldFByb2dyYW1BY2NvdW50c0ZpbHRlcltdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgZGF0YVNpemU6IDE2NSwgLy9zaXplIG9mIGFjY291bnQgKGJ5dGVzKVxyXG4gICAgICB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbWVtY21wOiB7XHJcbiAgICAgICAgICBvZmZzZXQ6IDMyLCAvL2xvY2F0aW9uIG9mIG91ciBxdWVyeSBpbiB0aGUgYWNjb3VudCAoYnl0ZXMpXHJcbiAgICAgICAgICBieXRlczogd2FsbGV0LCAvL291ciBzZWFyY2ggY3JpdGVyaWEsIGEgYmFzZTU4IGVuY29kZWQgc3RyaW5nXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIG1lbWNtcDoge1xyXG4gICAgICAgICAgb2Zmc2V0OiAwLCAvL251bWJlciBvZiBieXRlc1xyXG4gICAgICAgICAgYnl0ZXM6IGNvbnRyYWN0QWRkcmVzcywgLy9iYXNlNTggZW5jb2RlZCBzdHJpbmdcclxuICAgICAgICB9LFxyXG4gICAgICB9LFxyXG4gICAgXTtcclxuICAgIGNvbnN0IGFjY291bnRzID0gYXdhaXQgc29sYW5hQ29ubmVjdGlvbi5nZXRQYXJzZWRQcm9ncmFtQWNjb3VudHMoXHJcbiAgICAgIG5ldyBQdWJsaWNLZXkoXCJUb2tlbmtlZ1FmZVp5aU53QUpiTmJHS1BGWENXdUJ2ZjlTczYyM1ZRNURBXCIpLFxyXG4gICAgICB7XHJcbiAgICAgICAgZmlsdGVyczogZmlsdGVycyxcclxuICAgICAgfVxyXG4gICAgKTtcclxuICAgIGNvbnNvbGUubG9nKFxyXG4gICAgICBgRm91bmQgJHthY2NvdW50cy5sZW5ndGh9IHRva2VuIGFjY291bnQocykgZm9yIHdhbGxldCAke3dhbGxldH0uYFxyXG4gICAgKTtcclxuICAgIGNvbnN0IHBhcnNlZEFjY291bnRJbmZvOiBhbnkgPSBhY2NvdW50c1swXS5hY2NvdW50LmRhdGE7XHJcbiAgICBjb25zb2xlLmxvZyhwYXJzZWRBY2NvdW50SW5mbywgXCJwYXJzZWRBY2NvdW50SW5mb1wiKTtcclxuICAgIC8vY29uc3QgbWludEFkZHJlc3M6IHN0cmluZyA9IHBhcnNlZEFjY291bnRJbmZvW1wicGFyc2VkXCJdW1wiaW5mb1wiXVtcIm1pbnRcIl07XHJcbiAgICBjb25zdCB0b2tlbkJhbGFuY2U6IG51bWJlciA9XHJcbiAgICAgIHBhcnNlZEFjY291bnRJbmZvW1wicGFyc2VkXCJdW1wiaW5mb1wiXVtcInRva2VuQW1vdW50XCJdW1widWlBbW91bnRcIl07XHJcbiAgICByZXR1cm4gdG9rZW5CYWxhbmNlO1xyXG4gIH1cclxufVxyXG5jYXRjaChlcnIpe1xyXG4gIGNvbnNvbGUubG9nKGVycik7XHJcbiAgcmV0dXJuIDA7XHJcbn1cclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gZ2V0U29sQ29ubmVjdGlvbigpIHtcclxuICAvLyBjb25zdCBjb25uZWN0aW9uID0gbmV3IENvbm5lY3Rpb24oU09MQU5BX1JQQ19QUk9WSURFUiwgXCJjb25maXJtZWRcIik7XHJcbiAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKGNsdXN0ZXJBcGlVcmwoXCJkZXZuZXRcIiksXCJjb25maXJtZWRcIik7XHJcbiAgcmV0dXJuIGNvbm5lY3Rpb247XHJcbn1cclxuIl19