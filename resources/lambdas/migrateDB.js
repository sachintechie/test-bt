"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const child_process_1 = require("child_process");
const handler = async () => {
    return new Promise((resolve, reject) => {
        (0, child_process_1.exec)('npx prisma db push', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing schema push: ${stderr}`);
                reject(`Migration failed: ${stderr}`);
            }
            else {
                console.log(`Migration successful: ${stdout}`);
                resolve(`Migration successful: ${stdout}`);
            }
        });
    });
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0ZURCLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWlncmF0ZURCLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlEQUFxQztBQUU5QixNQUFNLE9BQU8sR0FBRyxLQUFLLElBQXFCLEVBQUU7SUFDakQsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxJQUFBLG9CQUFJLEVBQUMsb0JBQW9CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ25ELElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsT0FBTyxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDeEQsTUFBTSxDQUFDLHFCQUFxQixNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLENBQUM7aUJBQU0sQ0FBQztnQkFDTixPQUFPLENBQUMsR0FBRyxDQUFDLHlCQUF5QixNQUFNLEVBQUUsQ0FBQyxDQUFDO2dCQUMvQyxPQUFPLENBQUMseUJBQXlCLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDN0MsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDLENBQUM7QUFaVyxRQUFBLE9BQU8sV0FZbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgZXhlYygnbnB4IHByaXNtYSBkYiBwdXNoJywgKGVycm9yLCBzdGRvdXQsIHN0ZGVycikgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoYEVycm9yIGV4ZWN1dGluZyBzY2hlbWEgcHVzaDogJHtzdGRlcnJ9YCk7XG4gICAgICAgIHJlamVjdChgTWlncmF0aW9uIGZhaWxlZDogJHtzdGRlcnJ9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZyhgTWlncmF0aW9uIHN1Y2Nlc3NmdWw6ICR7c3Rkb3V0fWApO1xuICAgICAgICByZXNvbHZlKGBNaWdyYXRpb24gc3VjY2Vzc2Z1bDogJHtzdGRvdXR9YCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufTsiXX0=