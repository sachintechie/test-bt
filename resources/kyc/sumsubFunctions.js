"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumsubWebhookListener = exports.getApplicantDataByExternalId = exports.createApplicant = exports.generateAccessToken = void 0;
const crypto_1 = require("crypto");
const dbFunctions_1 = require("../db/dbFunctions");
const generateAccessToken = async (userId, levelName = "basic-kyc-level") => {
    const sumsubConfig = await (0, dbFunctions_1.getMasterSumsubConfig)();
    console.log(sumsubConfig);
    if (sumsubConfig != null) {
        const endPoint = `/resources/accessTokens?ttlInSecs=600&userId=${userId}&levelName=${levelName}`;
        const url = `${sumsubConfig.baseurl}${endPoint}`;
        const options = {
            method: "POST",
            headers: {
                Accept: "application/json",
                "X-App-Token": sumsubConfig.sumsub_app_token
            },
            url: endPoint,
            body: ""
        };
        createSignature(options, sumsubConfig.sumsub_secret_key);
        try {
            const res = await fetch(url, options);
            const data = await res.json();
            return data;
        }
        catch (error) {
            // console.log(error);
            throw "error in getting access token";
        }
    }
    else {
        throw "error in getting sumsub config";
    }
};
exports.generateAccessToken = generateAccessToken;
const createApplicant = async (userId, levelName = "basic-kyc-level") => {
    const sumsubConfig = await (0, dbFunctions_1.getMasterSumsubConfig)();
    console.log("sumsubConfig", sumsubConfig);
    if (sumsubConfig != null) {
        const endPoint = `/resources/applicants?levelName=${encodeURIComponent(levelName)}`;
        const url = `${sumsubConfig.baseurl}${endPoint}`;
        const options = {
            url: endPoint,
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                "X-App-Token": sumsubConfig.sumsub_app_token
            },
            body: JSON.stringify({ externalUserId: userId })
        };
        createSignature(options, sumsubConfig.sumsub_secret_key);
        // console.log(options);
        try {
            const res = await fetch(url, options);
            const data = await res.json();
            return data;
        }
        catch (error) {
            console.log(error);
            throw "error in creating applicant";
        }
    }
    else {
        throw "error in getting sumsub config";
    }
    ;
};
exports.createApplicant = createApplicant;
const getApplicantDataByExternalId = async (userId) => {
    const sumsubConfig = await (0, dbFunctions_1.getMasterSumsubConfig)();
    if (sumsubConfig != null) {
        const endPoint = `/resources/applicants/-;externalUserId=${userId}/one`;
        const url = `${sumsubConfig.baseurl}${endPoint}`;
        const options = {
            url: endPoint,
            method: "GET",
            headers: {
                "content-type": "application/json",
                "X-App-Token": sumsubConfig.sumsub_app_token
            }
        };
        createSignature(options, sumsubConfig.sumsub_secret_key);
        console.log(options);
        try {
            const res = await fetch(url, options);
            const data = await res.json();
            return data;
        }
        catch (error) {
            console.log(error);
            throw "error in getting applicant data";
        }
    }
    else {
        throw "error in getting sumsub config";
    }
};
exports.getApplicantDataByExternalId = getApplicantDataByExternalId;
const sumsubWebhookListener = async (event) => {
    try {
        const customerKyc = await (0, dbFunctions_1.getCustomerKyc)(event.arguments.input.externalUserId);
        if (customerKyc != null) {
            const updateKyc = await (0, dbFunctions_1.updateCustomerKycStatus)(event.arguments.input.externalUserId, event.arguments.input.reviewStatus);
            console.log(updateKyc);
            return {
                status: 200,
                data: customerKyc,
                error: null
            };
        }
        else {
            return {
                status: 400,
                data: null,
                error: "Customer Kyc not found"
            };
        }
    }
    catch (err) {
        throw "error in webhook listener";
    }
};
exports.sumsubWebhookListener = sumsubWebhookListener;
function createSignature(config, sumsub_secret_key) {
    var ts = Math.floor(Date.now() / 1000);
    const signature = (0, crypto_1.createHmac)("sha256", sumsub_secret_key);
    signature.update(ts + config.method.toUpperCase() + config.url);
    if (config.body instanceof FormData) {
        signature.update(config.body.getBuffer());
    }
    else if (config.body) {
        signature.update(config.body);
    }
    config.headers["X-App-Access-Ts"] = ts.toString();
    config.headers["X-App-Access-Sig"] = signature.digest("hex");
    return config;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3Vtc3ViRnVuY3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic3Vtc3ViRnVuY3Rpb25zLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLG1DQUFvQztBQUNwQyxtREFBbUc7QUFFNUYsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLEVBQUUsTUFBYyxFQUFFLFNBQVMsR0FBRyxpQkFBaUIsRUFBRSxFQUFFO0lBQ3pGLE1BQU0sWUFBWSxHQUFHLE1BQU0sSUFBQSxtQ0FBcUIsR0FBRSxDQUFDO0lBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDMUIsSUFBRyxZQUFZLElBQUksSUFBSSxFQUFFLENBQUM7UUFDMUIsTUFBTSxRQUFRLEdBQUcsZ0RBQWdELE1BQU0sY0FBYyxTQUFTLEVBQUUsQ0FBQztRQUNqRyxNQUFNLEdBQUcsR0FBRyxHQUFHLFlBQVksQ0FBQyxPQUFPLEdBQUcsUUFBUSxFQUFFLENBQUM7UUFDakQsTUFBTSxPQUFPLEdBQUc7WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRTtnQkFDUCxNQUFNLEVBQUUsa0JBQWtCO2dCQUMxQixhQUFhLEVBQUUsWUFBWSxDQUFDLGdCQUFnQjthQUM3QztZQUNELEdBQUcsRUFBRSxRQUFRO1lBQ2IsSUFBSSxFQUFFLEVBQUU7U0FDVCxDQUFDO1FBQ0QsZUFBZSxDQUFDLE9BQU8sRUFBQyxZQUFZLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN6RCxJQUFJLENBQUM7WUFDSCxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDdEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDOUIsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNmLHNCQUFzQjtZQUN0QixNQUFNLCtCQUErQixDQUFDO1FBQ3hDLENBQUM7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LFNBQVMsR0FBSSxJQUFBLG1CQUFVLEVBQUMsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDM0QsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFaEUsSUFBSSxNQUFNLENBQUMsSUFBSSxZQUFZLFFBQVEsRUFBRSxDQUFDO1FBQ3BDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7U0FBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2QixTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBQ0QsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNsRCxNQUFNLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUU3RCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlSG1hYyB9IGZyb20gXCJjcnlwdG9cIjtcbmltcG9ydCB7IGdldEN1c3RvbWVyS3ljLCBnZXRNYXN0ZXJTdW1zdWJDb25maWcsIHVwZGF0ZUN1c3RvbWVyS3ljU3RhdHVzIH0gZnJvbSBcIi4uL2RiL2RiRnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBjb25zdCBnZW5lcmF0ZUFjY2Vzc1Rva2VuID0gYXN5bmMgKHVzZXJJZDogc3RyaW5nLCBsZXZlbE5hbWUgPSBcImJhc2ljLWt5Yy1sZXZlbFwiKSA9PiB7XG4gIGNvbnN0IHN1bXN1YkNvbmZpZyA9IGF3YWl0IGdldE1hc3RlclN1bXN1YkNvbmZpZygpO1xuICBjb25zb2xlLmxvZyhzdW1zdWJDb25maWcpO1xuICBpZihzdW1zdWJDb25maWcgIT0gbnVsbCkge1xuICBjb25zdCBlbmRQb2ludCA9IGAvcmVzb3VyY2VzL2FjY2Vzc1Rva2Vucz90dGxJblNlY3M9NjAwJnVzZXJJZD0ke3VzZXJJZH0mbGV2ZWxOYW1lPSR7bGV2ZWxOYW1lfWA7XG4gIGNvbnN0IHVybCA9IGAke3N1bXN1YkNvbmZpZy5iYXNldXJsfSR7ZW5kUG9pbnR9YDtcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICBcIlgtQXBwLVRva2VuXCI6IHN1bXN1YkNvbmZpZy5zdW1zdWJfYXBwX3Rva2VuIFxuICAgIH0sXG4gICAgdXJsOiBlbmRQb2ludCxcbiAgICBib2R5OiBcIlwiXG4gIH07XG4gICBjcmVhdGVTaWduYXR1cmUob3B0aW9ucyxzdW1zdWJDb25maWcuc3Vtc3ViX3NlY3JldF9rZXkpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgb3B0aW9ucyk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gY29uc29sZS5sb2coZXJyb3IpO1xuICAgIHRocm93IFwiZXJyb3IgaW4gZ2V0dGluZyBhY2Nlc3MgdG9rZW5cIjtcbiAgfVxufVxuZWxzZXtcbiAgdGhyb3cgXCJlcnJvciBpbiBnZXR0aW5nIHN1bXN1YiBjb25maWdcIjtcblxufVxufTtcbmV4cG9ydCBjb25zdCBjcmVhdGVBcHBsaWNhbnQgPSBhc3luYyAodXNlcklkOiBzdHJpbmcsIGxldmVsTmFtZSA9IFwiYmFzaWMta3ljLWxldmVsXCIpID0+IHtcbiAgY29uc3Qgc3Vtc3ViQ29uZmlnID0gYXdhaXQgZ2V0TWFzdGVyU3Vtc3ViQ29uZmlnKCk7XG4gIGNvbnNvbGUubG9nKFwic3Vtc3ViQ29uZmlnXCIsc3Vtc3ViQ29uZmlnKTtcbiAgaWYoc3Vtc3ViQ29uZmlnICE9IG51bGwpIHtcbiAgY29uc3QgZW5kUG9pbnQgPSBgL3Jlc291cmNlcy9hcHBsaWNhbnRzP2xldmVsTmFtZT0ke2VuY29kZVVSSUNvbXBvbmVudChsZXZlbE5hbWUpfWA7XG4gIGNvbnN0IHVybCA9IGAke3N1bXN1YkNvbmZpZy5iYXNldXJsfSR7ZW5kUG9pbnR9YDtcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICB1cmw6IGVuZFBvaW50LFxuICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgaGVhZGVyczoge1xuICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgXCJYLUFwcC1Ub2tlblwiOiBzdW1zdWJDb25maWcuc3Vtc3ViX2FwcF90b2tlblxuICAgIH0sXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBleHRlcm5hbFVzZXJJZDogdXNlcklkIH0pXG4gIH07XG4gIGNyZWF0ZVNpZ25hdHVyZShvcHRpb25zLHN1bXN1YkNvbmZpZy5zdW1zdWJfc2VjcmV0X2tleSk7XG4gIC8vIGNvbnNvbGUubG9nKG9wdGlvbnMpO1xuICB0cnkge1xuICAgIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKHVybCwgb3B0aW9ucyk7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIHRocm93IFwiZXJyb3IgaW4gY3JlYXRpbmcgYXBwbGljYW50XCI7XG4gIH1cbn1cbmVsc2V7XG4gIHRocm93IFwiZXJyb3IgaW4gZ2V0dGluZyBzdW1zdWIgY29uZmlnXCI7XG59O1xufVxuZXhwb3J0IGNvbnN0IGdldEFwcGxpY2FudERhdGFCeUV4dGVybmFsSWQgPSBhc3luYyAodXNlcklkOiBzdHJpbmcpID0+IHtcbiAgY29uc3Qgc3Vtc3ViQ29uZmlnID0gYXdhaXQgZ2V0TWFzdGVyU3Vtc3ViQ29uZmlnKCk7XG4gIGlmKHN1bXN1YkNvbmZpZyAhPSBudWxsKSB7XG5cbiAgY29uc3QgZW5kUG9pbnQgPSBgL3Jlc291cmNlcy9hcHBsaWNhbnRzLy07ZXh0ZXJuYWxVc2VySWQ9JHt1c2VySWR9L29uZWA7XG4gIGNvbnN0IHVybCA9IGAke3N1bXN1YkNvbmZpZy5iYXNldXJsfSR7ZW5kUG9pbnR9YDtcbiAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICB1cmw6IGVuZFBvaW50LFxuICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICBoZWFkZXJzOiB7XG4gICAgICBcImNvbnRlbnQtdHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgIFwiWC1BcHAtVG9rZW5cIjogc3Vtc3ViQ29uZmlnLnN1bXN1Yl9hcHBfdG9rZW4gXG4gICAgfVxuICB9O1xuICAgY3JlYXRlU2lnbmF0dXJlKG9wdGlvbnMsc3Vtc3ViQ29uZmlnLnN1bXN1Yl9zZWNyZXRfa2V5KTtcbiAgY29uc29sZS5sb2cob3B0aW9ucyk7XG4gIHRyeSB7XG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCBvcHRpb25zKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzLmpzb24oKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgIHRocm93IFwiZXJyb3IgaW4gZ2V0dGluZyBhcHBsaWNhbnQgZGF0YVwiO1xuICB9XG59XG5lbHNle1xuICB0aHJvdyBcImVycm9yIGluIGdldHRpbmcgc3Vtc3ViIGNvbmZpZ1wiO1xufVxufTtcblxuZXhwb3J0IGNvbnN0IHN1bXN1YldlYmhvb2tMaXN0ZW5lciA9IGFzeW5jIChldmVudDogYW55KSA9PiB7XG4gIHRyeSB7XG5cbiAgICBjb25zdCBjdXN0b21lckt5YyA9IGF3YWl0IGdldEN1c3RvbWVyS3ljKGV2ZW50LmFyZ3VtZW50cy5pbnB1dC5leHRlcm5hbFVzZXJJZCk7XG4gICAgaWYoY3VzdG9tZXJLeWMgIT0gbnVsbCApe1xuICAgICAgY29uc3QgdXBkYXRlS3ljID0gYXdhaXQgdXBkYXRlQ3VzdG9tZXJLeWNTdGF0dXMoZXZlbnQuYXJndW1lbnRzLmlucHV0LmV4dGVybmFsVXNlcklkLGV2ZW50LmFyZ3VtZW50cy5pbnB1dC5yZXZpZXdTdGF0dXMpO1xuICAgICAgY29uc29sZS5sb2codXBkYXRlS3ljKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0YXR1czogMjAwLFxuICAgICAgICBkYXRhOiBjdXN0b21lckt5YyxcbiAgICAgICAgZXJyb3I6IG51bGxcbiAgICAgIH07XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXM6IDQwMCxcbiAgICAgICAgZGF0YTogbnVsbCxcbiAgICAgICAgZXJyb3I6IFwiQ3VzdG9tZXIgS3ljIG5vdCBmb3VuZFwiXG4gICAgICB9O1xuICAgIH1cbiAgXG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRocm93IFwiZXJyb3IgaW4gd2ViaG9vayBsaXN0ZW5lclwiO1xuICB9XG59O1xuXG4gZnVuY3Rpb24gY3JlYXRlU2lnbmF0dXJlKGNvbmZpZzogYW55LHN1bXN1Yl9zZWNyZXRfa2V5OnN0cmluZykge1xuICB2YXIgdHMgPSBNYXRoLmZsb29yKERhdGUubm93KCkgLyAxMDAwKTtcbiAgY29uc3Qgc2lnbmF0dXJlID0gIGNyZWF0ZUhtYWMoXCJzaGEyNTZcIiwgc3Vtc3ViX3NlY3JldF9rZXkpO1xuICBzaWduYXR1cmUudXBkYXRlKHRzICsgY29uZmlnLm1ldGhvZC50b1VwcGVyQ2FzZSgpICsgY29uZmlnLnVybCk7XG5cbiAgaWYgKGNvbmZpZy5ib2R5IGluc3RhbmNlb2YgRm9ybURhdGEpIHtcbiAgICBzaWduYXR1cmUudXBkYXRlKGNvbmZpZy5ib2R5LmdldEJ1ZmZlcigpKTtcbiAgfSBlbHNlIGlmIChjb25maWcuYm9keSkge1xuICAgIHNpZ25hdHVyZS51cGRhdGUoY29uZmlnLmJvZHkpO1xuICB9XG4gIGNvbmZpZy5oZWFkZXJzW1wiWC1BcHAtQWNjZXNzLVRzXCJdID0gdHMudG9TdHJpbmcoKTtcbiAgY29uZmlnLmhlYWRlcnNbXCJYLUFwcC1BY2Nlc3MtU2lnXCJdID0gc2lnbmF0dXJlLmRpZ2VzdChcImhleFwiKTtcblxuICByZXR1cm4gY29uZmlnO1xufSJdfQ==