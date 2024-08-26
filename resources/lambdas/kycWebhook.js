"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const sumsubFunctions_1 = require("../kyc/sumsubFunctions");
const handler = async (event, context) => {
    try {
        console.log(event, context);
        console.log("event", event);
        const resp = await (0, sumsubFunctions_1.sumsubWebhookListener)(event);
        const response = {
            status: 200,
            data: resp,
            error: ""
        };
        console.log("generate sumsub token", response);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia3ljV2ViaG9vay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImt5Y1dlYmhvb2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNERBQStEO0FBRXhELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUFVLEVBQUUsT0FBWSxFQUFFLEVBQUU7SUFDeEQsSUFBSSxDQUFDO1FBQ0gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDNUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFNUIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFBLHVDQUFxQixFQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWhELE1BQU0sUUFBUSxHQUFHO1lBQ2YsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxFQUFFO1NBQ1YsQ0FBQztRQUNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFL0MsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUFDLE9BQU8sR0FBUSxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN6QyxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUc7WUFDWCxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxHQUFHO1NBQ1gsQ0FBQztJQUNKLENBQUM7QUFDSCxDQUFDLENBQUM7QUF2QlcsUUFBQSxPQUFPLFdBdUJsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHN1bXN1YldlYmhvb2tMaXN0ZW5lciB9IGZyb20gXCIuLi9reWMvc3Vtc3ViRnVuY3Rpb25zXCI7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICB0cnkge1xuICAgIGNvbnNvbGUubG9nKGV2ZW50LCBjb250ZXh0KTtcbiAgICBjb25zb2xlLmxvZyhcImV2ZW50XCIsIGV2ZW50KTtcblxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBzdW1zdWJXZWJob29rTGlzdGVuZXIoZXZlbnQpO1xuICAgIFxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3RhdHVzOiAyMDAsXG4gICAgICBkYXRhOiByZXNwLFxuICAgICAgZXJyb3I6IFwiXCJcbiAgICB9O1xuICAgIGNvbnNvbGUubG9nKFwiZ2VuZXJhdGUgc3Vtc3ViIHRva2VuXCIsIHJlc3BvbnNlKTtcblxuICAgIHJldHVybiByZXNwb25zZTtcbiAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICBjb25zb2xlLmxvZyhcIkluIGNhdGNoIEJsb2NrIEVycm9yXCIsIGVycik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogNDAwLFxuICAgICAgZGF0YTogbnVsbCxcbiAgICAgIGVycm9yOiBlcnJcbiAgICB9O1xuICB9XG59OyJdfQ==