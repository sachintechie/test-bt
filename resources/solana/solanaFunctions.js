"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolConnection = getSolConnection;
exports.verifySolanaTransaction = verifySolanaTransaction;
exports.getSolBalance = getSolBalance;
exports.getSplTokenBalance = getSplTokenBalance;
exports.getStakeAccountInfo = getStakeAccountInfo;
const web3_js_1 = require("@solana/web3.js");
const SOLANA_NETWORK_URL = process.env["SOLANA_NETWORK_URL"] ?? "https://api.devnet.solana.com"; // Use 'https://api.mainnet-beta.solana.com' for mainnet
async function getSolConnection() {
    console.log(SOLANA_NETWORK_URL);
    const connection = new web3_js_1.Connection(SOLANA_NETWORK_URL, "confirmed");
    // const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    return connection;
}
async function verifySolanaTransaction(txId) {
    const connection = await getSolConnection();
    const result = await connection.getSignatureStatus(txId, {
        searchTransactionHistory: true
    });
    console.log(result);
    return result.value?.confirmationStatus;
}
async function getSolBalance(address) {
    try {
        const pubkey = new web3_js_1.PublicKey(address);
        const connection = await getSolConnection();
        const balance = (await connection.getBalance(pubkey)) / web3_js_1.LAMPORTS_PER_SOL;
        return balance;
    }
    catch (err) {
        console.log(err);
        return 0;
    }
}
async function getSplTokenBalance(wallet, contractAddress) {
    try {
        if (contractAddress === "") {
            return 0; //no contract address
        }
        else {
            const solanaConnection = await getSolConnection();
            const filters = [
                {
                    dataSize: 165 //size of account (bytes)
                },
                {
                    memcmp: {
                        offset: 32, //location of our query in the account (bytes)
                        bytes: wallet //our search criteria, a base58 encoded string
                    }
                },
                {
                    memcmp: {
                        offset: 0, //number of bytes
                        bytes: contractAddress //base58 encoded string
                    }
                }
            ];
            const accounts = await solanaConnection.getParsedProgramAccounts(new web3_js_1.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"), {
                filters: filters
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
async function getStakeAccountInfo(stakeAccountPubKey, connection) {
    const stakeAccountPubkey = new web3_js_1.PublicKey(stakeAccountPubKey);
    const stakeAccountInfo = await connection.getParsedAccountInfo(stakeAccountPubkey);
    const stakeAccountData = stakeAccountInfo.value?.data;
    if (!stakeAccountData || !("parsed" in stakeAccountData)) {
        return { currentStakeAmount: null, error: "Failed to parse stake account data" };
    }
    const stakeAccount = stakeAccountData.parsed.info;
    console.log(stakeAccount);
    const currentStakeAmount = stakeAccount.stake?.delegation?.stake ?? 0;
    return { currentStakeAmount, error: null };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic29sYW5hRnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic29sYW5hRnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsNENBTUM7QUFFRCwwREFPQztBQUNELHNDQVVDO0FBRUQsZ0RBcUNDO0FBRUQsa0RBWUM7QUFuRkQsNkNBQW9HO0FBRXBHLE1BQU0sa0JBQWtCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLCtCQUErQixDQUFDLENBQUMsd0RBQXdEO0FBRWxKLEtBQUssVUFBVSxnQkFBZ0I7SUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0lBRWhDLE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQVUsQ0FBQyxrQkFBa0IsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNuRSwyRUFBMkU7SUFDM0UsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVNLEtBQUssVUFBVSx1QkFBdUIsQ0FBQyxJQUFZO0lBQ3hELE1BQU0sVUFBVSxHQUFHLE1BQU0sZ0JBQWdCLEVBQUUsQ0FBQztJQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUU7UUFDdkQsd0JBQXdCLEVBQUUsSUFBSTtLQUMvQixDQUFDLENBQUM7SUFDSCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sTUFBTSxDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQztBQUMxQyxDQUFDO0FBQ00sS0FBSyxVQUFVLGFBQWEsQ0FBQyxPQUFlO0lBQ2pELElBQUksQ0FBQztRQUNILE1BQU0sTUFBTSxHQUFHLElBQUksbUJBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN0QyxNQUFNLFVBQVUsR0FBRyxNQUFNLGdCQUFnQixFQUFFLENBQUM7UUFDNUMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxNQUFNLFVBQVUsQ0FBQyxVQUFVLENBQUMs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QztBQUM3QyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29ubmVjdGlvbiwgTEFNUE9SVFNfUEVSX1NPTCwgUHVibGljS2V5LCBHZXRQcm9ncmFtQWNjb3VudHNGaWx0ZXIgfSBmcm9tIFwiQHNvbGFuYS93ZWIzLmpzXCI7XG5cbmNvbnN0IFNPTEFOQV9ORVRXT1JLX1VSTCA9IHByb2Nlc3MuZW52W1wiU09MQU5BX05FVFdPUktfVVJMXCJdID8/IFwiaHR0cHM6Ly9hcGkuZGV2bmV0LnNvbGFuYS5jb21cIjsgLy8gVXNlICdodHRwczovL2FwaS5tYWlubmV0LWJldGEuc29sYW5hLmNvbScgZm9yIG1haW5uZXRcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNvbENvbm5lY3Rpb24oKSB7XG4gIGNvbnNvbGUubG9nKFNPTEFOQV9ORVRXT1JLX1VSTCk7XG5cbiAgY29uc3QgY29ubmVjdGlvbiA9IG5ldyBDb25uZWN0aW9uKFNPTEFOQV9ORVRXT1JLX1VSTCwgXCJjb25maXJtZWRcIik7XG4gIC8vIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgQ29ubmVjdGlvbihjbHVzdGVyQXBpVXJsKFwiZGV2bmV0XCIpLCBcImNvbmZpcm1lZFwiKTtcbiAgcmV0dXJuIGNvbm5lY3Rpb247XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB2ZXJpZnlTb2xhbmFUcmFuc2FjdGlvbih0eElkOiBzdHJpbmcpIHtcbiAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IGdldFNvbENvbm5lY3Rpb24oKTtcbiAgY29uc3QgcmVzdWx0ID0gYXdhaXQgY29ubmVjdGlvbi5nZXRTaWduYXR1cmVTdGF0dXModHhJZCwge1xuICAgIHNlYXJjaFRyYW5zYWN0aW9uSGlzdG9yeTogdHJ1ZVxuICB9KTtcbiAgY29uc29sZS5sb2cocmVzdWx0KTtcbiAgcmV0dXJuIHJlc3VsdC52YWx1ZT8uY29uZmlybWF0aW9uU3RhdHVzO1xufVxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNvbEJhbGFuY2UoYWRkcmVzczogc3RyaW5nKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgcHVia2V5ID0gbmV3IFB1YmxpY0tleShhZGRyZXNzKTtcbiAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgZ2V0U29sQ29ubmVjdGlvbigpO1xuICAgIGNvbnN0IGJhbGFuY2UgPSAoYXdhaXQgY29ubmVjdGlvbi5nZXRCYWxhbmNlKHB1YmtleSkpIC8gTEFNUE9SVFNfUEVSX1NPTDtcbiAgICByZXR1cm4gYmFsYW5jZTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgICByZXR1cm4gMDtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3BsVG9rZW5CYWxhbmNlKHdhbGxldDogc3RyaW5nLCBjb250cmFjdEFkZHJlc3M6IHN0cmluZykge1xuICB0cnkge1xuICAgIGlmIChjb250cmFjdEFkZHJlc3MgPT09IFwiXCIpIHtcbiAgICAgIHJldHVybiAwOyAvL25vIGNvbnRyYWN0IGFkZHJlc3NcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc29sYW5hQ29ubmVjdGlvbiA9IGF3YWl0IGdldFNvbENvbm5lY3Rpb24oKTtcbiAgICAgIGNvbnN0IGZpbHRlcnM6IEdldFByb2dyYW1BY2NvdW50c0ZpbHRlcltdID0gW1xuICAgICAgICB7XG4gICAgICAgICAgZGF0YVNpemU6IDE2NSAvL3NpemUgb2YgYWNjb3VudCAoYnl0ZXMpXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBtZW1jbXA6IHtcbiAgICAgICAgICAgIG9mZnNldDogMzIsIC8vbG9jYXRpb24gb2Ygb3VyIHF1ZXJ5IGluIHRoZSBhY2NvdW50IChieXRlcylcbiAgICAgICAgICAgIGJ5dGVzOiB3YWxsZXQgLy9vdXIgc2VhcmNoIGNyaXRlcmlhLCBhIGJhc2U1OCBlbmNvZGVkIHN0cmluZ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIG1lbWNtcDoge1xuICAgICAgICAgICAgb2Zmc2V0OiAwLCAvL251bWJlciBvZiBieXRlc1xuICAgICAgICAgICAgYnl0ZXM6IGNvbnRyYWN0QWRkcmVzcyAvL2Jhc2U1OCBlbmNvZGVkIHN0cmluZ1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXTtcbiAgICAgIGNvbnN0IGFjY291bnRzID0gYXdhaXQgc29sYW5hQ29ubmVjdGlvbi5nZXRQYXJzZWRQcm9ncmFtQWNjb3VudHMobmV3IFB1YmxpY0tleShcIlRva2Vua2VnUWZlWnlpTndBSmJOYkdLUEZYQ1d1QnZmOVNzNjIzVlE1REFcIiksIHtcbiAgICAgICAgZmlsdGVyczogZmlsdGVyc1xuICAgICAgfSk7XG4gICAgICBjb25zb2xlLmxvZyhgRm91bmQgJHthY2NvdW50cy5sZW5ndGh9IHRva2VuIGFjY291bnQocykgZm9yIHdhbGxldCAke3dhbGxldH0uYCk7XG4gICAgICBjb25zdCBwYXJzZWRBY2NvdW50SW5mbzogYW55ID0gYWNjb3VudHNbMF0uYWNjb3VudC5kYXRhO1xuICAgICAgY29uc29sZS5sb2cocGFyc2VkQWNjb3VudEluZm8sIFwicGFyc2VkQWNjb3VudEluZm9cIik7XG4gICAgICAvL2NvbnN0IG1pbnRBZGRyZXNzOiBzdHJpbmcgPSBwYXJzZWRBY2NvdW50SW5mb1tcInBhcnNlZFwiXVtcImluZm9cIl1bXCJtaW50XCJdO1xuICAgICAgY29uc3QgdG9rZW5CYWxhbmNlOiBudW1iZXIgPSBwYXJzZWRBY2NvdW50SW5mb1tcInBhcnNlZFwiXVtcImluZm9cIl1bXCJ0b2tlbkFtb3VudFwiXVtcInVpQW1vdW50XCJdO1xuICAgICAgcmV0dXJuIHRva2VuQmFsYW5jZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFN0YWtlQWNjb3VudEluZm8oc3Rha2VBY2NvdW50UHViS2V5OiBzdHJpbmcsIGNvbm5lY3Rpb246IENvbm5lY3Rpb24pIHtcbiAgY29uc3Qgc3Rha2VBY2NvdW50UHVia2V5ID0gbmV3IFB1YmxpY0tleShzdGFrZUFjY291bnRQdWJLZXkpO1xuICBjb25zdCBzdGFrZUFjY291bnRJbmZvID0gYXdhaXQgY29ubmVjdGlvbi5nZXRQYXJzZWRBY2NvdW50SW5mbyhzdGFrZUFjY291bnRQdWJrZXkpO1xuICBjb25zdCBzdGFrZUFjY291bnREYXRhID0gc3Rha2VBY2NvdW50SW5mby52YWx1ZT8uZGF0YTtcbiAgaWYgKCFzdGFrZUFjY291bnREYXRhIHx8ICEoXCJwYXJzZWRcIiBpbiBzdGFrZUFjY291bnREYXRhKSkge1xuICAgIHJldHVybiB7IGN1cnJlbnRTdGFrZUFtb3VudDogbnVsbCwgZXJyb3I6IFwiRmFpbGVkIHRvIHBhcnNlIHN0YWtlIGFjY291bnQgZGF0YVwiIH07XG4gIH1cbiAgY29uc3Qgc3Rha2VBY2NvdW50ID0gc3Rha2VBY2NvdW50RGF0YS5wYXJzZWQuaW5mbztcbiAgY29uc29sZS5sb2coc3Rha2VBY2NvdW50KTtcblxuICBjb25zdCBjdXJyZW50U3Rha2VBbW91bnQgPSBzdGFrZUFjY291bnQuc3Rha2U/LmRlbGVnYXRpb24/LnN0YWtlID8/IDA7XG4gIHJldHVybiB7IGN1cnJlbnRTdGFrZUFtb3VudCwgZXJyb3I6IG51bGwgfTtcbn1cbiJdfQ==