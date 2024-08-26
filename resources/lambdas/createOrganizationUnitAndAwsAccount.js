"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_organizations_1 = require("@aws-sdk/client-organizations");
const client_iam_1 = require("@aws-sdk/client-iam");
const client_sts_1 = require("@aws-sdk/client-sts");
const organizationsClient = new client_organizations_1.OrganizationsClient({ region: "us-east-1" });
const stsClient = new client_sts_1.STSClient({ region: "us-east-1" });
const parentId = 'r-39nf'; // Replace with your root or parent OU ID
const roleName = 'OrganizationAccountAccessRole';
const handler = async (event, context) => {
    console.log("Creating new OU and AWS account", event);
    const { ouName, accountName, email } = event.arguments?.input;
    try {
        // Step 1: Create the new OU
        const createOUCommand = new client_organizations_1.CreateOrganizationalUnitCommand({
            ParentId: parentId,
            Name: ouName,
        });
        const createOUResponse = await organizationsClient.send(createOUCommand);
        const newOUId = createOUResponse.OrganizationalUnit?.Id;
        console.log("Organizational Unit Created:", newOUId);
        // Step 2: Create the new AWS account
        const createAccountCommand = new client_organizations_1.CreateAccountCommand({
            Email: email,
            AccountName: accountName,
            RoleName: roleName,
        });
        const createAccountResponse = await organizationsClient.send(createAccountCommand);
        const createAccountStatusId = createAccountResponse.CreateAccountStatus?.Id;
        console.log("Account creation initiated:", createAccountStatusId);
        // Wait for account creation to complete
        let accountId;
        while (!accountId) {
            const statusResponse = await organizationsClient.send(new client_organizations_1.DescribeCreateAccountStatusCommand({
                CreateAccountRequestId: createAccountStatusId,
            }));
            const accountStatus = statusResponse.CreateAccountStatus;
            if (accountStatus?.State === 'SUCCEEDED') {
                accountId = accountStatus?.AccountId;
                console.log("Account Created:", accountId);
            }
            else if (accountStatus?.State === 'FAILED') {
                throw new Error(`Account creation failed: ${accountStatus?.FailureReason}`);
            }
            await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
        }
        // Step 3: Move the new account to the new OU
        if (newOUId && accountId) {
            const moveAccountCommand = new client_organizations_1.MoveAccountCommand({
                AccountId: accountId,
                SourceParentId: parentId,
                DestinationParentId: newOUId,
            });
            await organizationsClient.send(moveAccountCommand);
            console.log("Account moved to new OU:", newOUId);
        }
        // Step 4: Assume the role in the new account to create necessary IAM policies and roles
        const assumeRoleCommand = new client_sts_1.AssumeRoleCommand({
            RoleArn: `arn:aws:iam::${accountId}:role/${roleName}`,
            RoleSessionName: 'NewAccountSession',
        });
        const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
        const credentials = assumeRoleResponse.Credentials;
        const newIamClient = new client_iam_1.IAMClient({
            region: "us-east-1",
            credentials: {
                accessKeyId: credentials.AccessKeyId,
                secretAccessKey: credentials.SecretAccessKey,
                sessionToken: credentials.SessionToken,
            },
        });
        // Step 5: Create a role in the new account with full administrative access
        const createRoleCommand = new client_iam_1.CreateRoleCommand({
            RoleName: 'AdminRole',
            AssumeRolePolicyDocument: JSON.stringify({
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: {
                            Service: [
                                "ec2.amazonaws.com",
                                "iam.amazonaws.com",
                                "organizations.amazonaws.com"
                            ],
                        },
                        Action: "sts:AssumeRole",
                    },
                ],
            }),
        });
        await newIamClient.send(createRoleCommand);
        // Step 6: Attach the AdministratorAccess policy to the role
        const attachUserPolicyCommand = new client_iam_1.AttachUserPolicyCommand({
            UserName: 'AdminUser',
            PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
        });
        await newIamClient.send(attachUserPolicyCommand);
        // Step 7: Create access keys for the new IAM user
        const createAccessKeyCommand = new client_iam_1.CreateAccessKeyCommand({
            UserName: 'AdminUser',
        });
        const createAccessKeyResponse = await newIamClient.send(createAccessKeyCommand);
        const accessKeyId = createAccessKeyResponse.AccessKey?.AccessKeyId;
        const secretAccessKey = createAccessKeyResponse.AccessKey?.SecretAccessKey;
        console.log("IAM Role with full administrative access created");
        return {
            status: 200,
            data: {
                accountId,
                accessKeyId,
                secretAccessKey,
            },
        };
    }
    catch (error) {
        console.error("Error creating OU or account:", error);
        return {
            status: 500,
            data: null,
            error: error
        };
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlT3JnYW5pemF0aW9uVW5pdEFuZEF3c0FjY291bnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGVPcmdhbml6YXRpb25Vbml0QW5kQXdzQWNjb3VudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx3RUFBbUw7QUFDbkwsb0RBSzZCO0FBQzdCLG9EQUFtRTtBQUVuRSxNQUFNLG1CQUFtQixHQUFHLElBQUksMENBQW1CLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUM3RSxNQUFNLFNBQVMsR0FBRyxJQUFJLHNCQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLENBQUMsQ0FBQztBQUV6RCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsQ0FBQyx5Q0FBeUM7QUFDcEUsTUFBTSxRQUFRLEdBQUcsK0JBQStCLENBQUM7QUFHMUMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQVUsRUFBRSxPQUFZLEVBQUUsRUFBRTtJQUN4RCxPQUFPLENBQUMsR0FBRyxDQUFDLGlDQUFpQyxFQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3JELE1BQU0sRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO0lBQzlELElBQUksQ0FBQztRQUNILDRCQUE0QjtRQUM1QixNQUFNLGVBQWUsR0FBRyxJQUFJLHNEQUErQixDQUFDO1lBQzFELFFBQVEsRUFBRSxRQUFRO1lBQ2xCLElBQUksRUFBRSxNQUFNO1NBQ2IsQ0FBQyxDQUFDO1FBQ0gsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLG1CQUFtQixDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUN6RSxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLENBQUM7UUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyw4QkFBOEIsRUFBRSxPQUFPLENBQUMsQ0FB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SyxFQUFFLEtBQUs7U0FDYixDQUFDO0lBQ0osQ0FBQztBQUNILENBQUMsQ0FBQztBQTNIVyxRQUFBLE9BQU8sV0EySGxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgT3JnYW5pemF0aW9uc0NsaWVudCwgQ3JlYXRlT3JnYW5pemF0aW9uYWxVbml0Q29tbWFuZCwgQ3JlYXRlQWNjb3VudENvbW1hbmQsIE1vdmVBY2NvdW50Q29tbWFuZCwgRGVzY3JpYmVDcmVhdGVBY2NvdW50U3RhdHVzQ29tbWFuZCB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtb3JnYW5pemF0aW9uc1wiO1xuaW1wb3J0IHtcbiAgSUFNQ2xpZW50LFxuICBDcmVhdGVSb2xlQ29tbWFuZCxcbiAgQ3JlYXRlQWNjZXNzS2V5Q29tbWFuZCxcbiAgQXR0YWNoVXNlclBvbGljeUNvbW1hbmRcbn0gZnJvbSBcIkBhd3Mtc2RrL2NsaWVudC1pYW1cIjtcbmltcG9ydCB7IFNUU0NsaWVudCwgQXNzdW1lUm9sZUNvbW1hbmQgfSBmcm9tIFwiQGF3cy1zZGsvY2xpZW50LXN0c1wiO1xuXG5jb25zdCBvcmdhbml6YXRpb25zQ2xpZW50ID0gbmV3IE9yZ2FuaXphdGlvbnNDbGllbnQoeyByZWdpb246IFwidXMtZWFzdC0xXCIgfSk7XG5jb25zdCBzdHNDbGllbnQgPSBuZXcgU1RTQ2xpZW50KHsgcmVnaW9uOiBcInVzLWVhc3QtMVwiIH0pO1xuXG5jb25zdCBwYXJlbnRJZCA9ICdyLTM5bmYnOyAvLyBSZXBsYWNlIHdpdGggeW91ciByb290IG9yIHBhcmVudCBPVSBJRFxuY29uc3Qgcm9sZU5hbWUgPSAnT3JnYW5pemF0aW9uQWNjb3VudEFjY2Vzc1JvbGUnO1xuXG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBhbnksIGNvbnRleHQ6IGFueSkgPT4ge1xuICBjb25zb2xlLmxvZyhcIkNyZWF0aW5nIG5ldyBPVSBhbmQgQVdTIGFjY291bnRcIixldmVudCk7XG4gIGNvbnN0IHsgb3VOYW1lLCBhY2NvdW50TmFtZSwgZW1haWwgfSA9IGV2ZW50LmFyZ3VtZW50cz8uaW5wdXQ7XG4gIHRyeSB7XG4gICAgLy8gU3RlcCAxOiBDcmVhdGUgdGhlIG5ldyBPVVxuICAgIGNvbnN0IGNyZWF0ZU9VQ29tbWFuZCA9IG5ldyBDcmVhdGVPcmdhbml6YXRpb25hbFVuaXRDb21tYW5kKHtcbiAgICAgIFBhcmVudElkOiBwYXJlbnRJZCxcbiAgICAgIE5hbWU6IG91TmFtZSxcbiAgICB9KTtcbiAgICBjb25zdCBjcmVhdGVPVVJlc3BvbnNlID0gYXdhaXQgb3JnYW5pemF0aW9uc0NsaWVudC5zZW5kKGNyZWF0ZU9VQ29tbWFuZCk7XG4gICAgY29uc3QgbmV3T1VJZCA9IGNyZWF0ZU9VUmVzcG9uc2UuT3JnYW5pemF0aW9uYWxVbml0Py5JZDtcbiAgICBjb25zb2xlLmxvZyhcIk9yZ2FuaXphdGlvbmFsIFVuaXQgQ3JlYXRlZDpcIiwgbmV3T1VJZCk7XG5cbiAgICAvLyBTdGVwIDI6IENyZWF0ZSB0aGUgbmV3IEFXUyBhY2NvdW50XG4gICAgY29uc3QgY3JlYXRlQWNjb3VudENvbW1hbmQgPSBuZXcgQ3JlYXRlQWNjb3VudENvbW1hbmQoe1xuICAgICAgRW1haWw6IGVtYWlsLFxuICAgICAgQWNjb3VudE5hbWU6IGFjY291bnROYW1lLFxuICAgICAgUm9sZU5hbWU6IHJvbGVOYW1lLFxuICAgIH0pO1xuICAgIGNvbnN0IGNyZWF0ZUFjY291bnRSZXNwb25zZSA9IGF3YWl0IG9yZ2FuaXphdGlvbnNDbGllbnQuc2VuZChjcmVhdGVBY2NvdW50Q29tbWFuZCk7XG4gICAgY29uc3QgY3JlYXRlQWNjb3VudFN0YXR1c0lkID0gY3JlYXRlQWNjb3VudFJlc3BvbnNlLkNyZWF0ZUFjY291bnRTdGF0dXM/LklkO1xuICAgIGNvbnNvbGUubG9nKFwiQWNjb3VudCBjcmVhdGlvbiBpbml0aWF0ZWQ6XCIsIGNyZWF0ZUFjY291bnRTdGF0dXNJZCk7XG5cbiAgICAvLyBXYWl0IGZvciBhY2NvdW50IGNyZWF0aW9uIHRvIGNvbXBsZXRlXG4gICAgbGV0IGFjY291bnRJZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICAgIHdoaWxlICghYWNjb3VudElkKSB7XG4gICAgICBjb25zdCBzdGF0dXNSZXNwb25zZSA9IGF3YWl0IG9yZ2FuaXphdGlvbnNDbGllbnQuc2VuZChuZXcgRGVzY3JpYmVDcmVhdGVBY2NvdW50U3RhdHVzQ29tbWFuZCh7XG4gICAgICAgIENyZWF0ZUFjY291bnRSZXF1ZXN0SWQ6IGNyZWF0ZUFjY291bnRTdGF0dXNJZCxcbiAgICAgIH0pKTtcbiAgICAgIGNvbnN0IGFjY291bnRTdGF0dXMgPSBzdGF0dXNSZXNwb25zZS5DcmVhdGVBY2NvdW50U3RhdHVzO1xuICAgICAgaWYgKGFjY291bnRTdGF0dXM/LlN0YXRlID09PSAnU1VDQ0VFREVEJykge1xuICAgICAgICBhY2NvdW50SWQgPSBhY2NvdW50U3RhdHVzPy5BY2NvdW50SWQ7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQWNjb3VudCBDcmVhdGVkOlwiLCBhY2NvdW50SWQpO1xuICAgICAgfSBlbHNlIGlmIChhY2NvdW50U3RhdHVzPy5TdGF0ZSA9PT0gJ0ZBSUxFRCcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBBY2NvdW50IGNyZWF0aW9uIGZhaWxlZDogJHthY2NvdW50U3RhdHVzPy5GYWlsdXJlUmVhc29ufWApO1xuICAgICAgfVxuICAgICAgYXdhaXQgbmV3IFByb21pc2UocmVzb2x2ZSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIDUwMDApKTsgLy8gV2FpdCBmb3IgNSBzZWNvbmRzIGJlZm9yZSBjaGVja2luZyBhZ2FpblxuICAgIH1cblxuICAgIC8vIFN0ZXAgMzogTW92ZSB0aGUgbmV3IGFjY291bnQgdG8gdGhlIG5ldyBPVVxuICAgIGlmIChuZXdPVUlkICYmIGFjY291bnRJZCkge1xuICAgICAgY29uc3QgbW92ZUFjY291bnRDb21tYW5kID0gbmV3IE1vdmVBY2NvdW50Q29tbWFuZCh7XG4gICAgICAgIEFjY291bnRJZDogYWNjb3VudElkLFxuICAgICAgICBTb3VyY2VQYXJlbnRJZDogcGFyZW50SWQsXG4gICAgICAgIERlc3RpbmF0aW9uUGFyZW50SWQ6IG5ld09VSWQsXG4gICAgICB9KTtcbiAgICAgIGF3YWl0IG9yZ2FuaXphdGlvbnNDbGllbnQuc2VuZChtb3ZlQWNjb3VudENvbW1hbmQpO1xuICAgICAgY29uc29sZS5sb2coXCJBY2NvdW50IG1vdmVkIHRvIG5ldyBPVTpcIiwgbmV3T1VJZCk7XG4gICAgfVxuXG4gICAgLy8gU3RlcCA0OiBBc3N1bWUgdGhlIHJvbGUgaW4gdGhlIG5ldyBhY2NvdW50IHRvIGNyZWF0ZSBuZWNlc3NhcnkgSUFNIHBvbGljaWVzIGFuZCByb2xlc1xuICAgIGNvbnN0IGFzc3VtZVJvbGVDb21tYW5kID0gbmV3IEFzc3VtZVJvbGVDb21tYW5kKHtcbiAgICAgIFJvbGVBcm46IGBhcm46YXdzOmlhbTo6JHthY2NvdW50SWR9OnJvbGUvJHtyb2xlTmFtZX1gLFxuICAgICAgUm9sZVNlc3Npb25OYW1lOiAnTmV3QWNjb3VudFNlc3Npb24nLFxuICAgIH0pO1xuICAgIGNvbnN0IGFzc3VtZVJvbGVSZXNwb25zZSA9IGF3YWl0IHN0c0NsaWVudC5zZW5kKGFzc3VtZVJvbGVDb21tYW5kKTtcbiAgICBjb25zdCBjcmVkZW50aWFscyA9IGFzc3VtZVJvbGVSZXNwb25zZS5DcmVkZW50aWFscztcblxuICAgIGNvbnN0IG5ld0lhbUNsaWVudCA9IG5ldyBJQU1DbGllbnQoe1xuICAgICAgcmVnaW9uOiBcInVzLWVhc3QtMVwiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgYWNjZXNzS2V5SWQ6IGNyZWRlbnRpYWxzIS5BY2Nlc3NLZXlJZCEsXG4gICAgICAgIHNlY3JldEFjY2Vzc0tleTogY3JlZGVudGlhbHMhLlNlY3JldEFjY2Vzc0tleSEsXG4gICAgICAgIHNlc3Npb25Ub2tlbjogY3JlZGVudGlhbHMhLlNlc3Npb25Ub2tlbiEsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU3RlcCA1OiBDcmVhdGUgYSByb2xlIGluIHRoZSBuZXcgYWNjb3VudCB3aXRoIGZ1bGwgYWRtaW5pc3RyYXRpdmUgYWNjZXNzXG4gICAgY29uc3QgY3JlYXRlUm9sZUNvbW1hbmQgPSBuZXcgQ3JlYXRlUm9sZUNvbW1hbmQoe1xuICAgICAgUm9sZU5hbWU6ICdBZG1pblJvbGUnLFxuICAgICAgQXNzdW1lUm9sZVBvbGljeURvY3VtZW50OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIFZlcnNpb246IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBFZmZlY3Q6IFwiQWxsb3dcIixcbiAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICBTZXJ2aWNlOiBbXG4gICAgICAgICAgICAgICAgXCJlYzIuYW1hem9uYXdzLmNvbVwiLFxuICAgICAgICAgICAgICAgIFwiaWFtLmFtYXpvbmF3cy5jb21cIixcbiAgICAgICAgICAgICAgICBcIm9yZ2FuaXphdGlvbnMuYW1hem9uYXdzLmNvbVwiXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQWN0aW9uOiBcInN0czpBc3N1bWVSb2xlXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0pLFxuICAgIH0pO1xuICAgIGF3YWl0IG5ld0lhbUNsaWVudC5zZW5kKGNyZWF0ZVJvbGVDb21tYW5kKTtcblxuICAgIC8vIFN0ZXAgNjogQXR0YWNoIHRoZSBBZG1pbmlzdHJhdG9yQWNjZXNzIHBvbGljeSB0byB0aGUgcm9sZVxuICAgIGNvbnN0IGF0dGFjaFVzZXJQb2xpY3lDb21tYW5kID0gbmV3IEF0dGFjaFVzZXJQb2xpY3lDb21tYW5kKHtcbiAgICAgIFVzZXJOYW1lOiAnQWRtaW5Vc2VyJyxcbiAgICAgIFBvbGljeUFybjogJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L0FkbWluaXN0cmF0b3JBY2Nlc3MnLFxuICAgIH0pO1xuICAgIGF3YWl0IG5ld0lhbUNsaWVudC5zZW5kKGF0dGFjaFVzZXJQb2xpY3lDb21tYW5kKTtcblxuICAgIC8vIFN0ZXAgNzogQ3JlYXRlIGFjY2VzcyBrZXlzIGZvciB0aGUgbmV3IElBTSB1c2VyXG4gICAgY29uc3QgY3JlYXRlQWNjZXNzS2V5Q29tbWFuZCA9IG5ldyBDcmVhdGVBY2Nlc3NLZXlDb21tYW5kKHtcbiAgICAgIFVzZXJOYW1lOiAnQWRtaW5Vc2VyJyxcbiAgICB9KTtcbiAgICBjb25zdCBjcmVhdGVBY2Nlc3NLZXlSZXNwb25zZSA9IGF3YWl0IG5ld0lhbUNsaWVudC5zZW5kKGNyZWF0ZUFjY2Vzc0tleUNvbW1hbmQpO1xuXG4gICAgY29uc3QgYWNjZXNzS2V5SWQgPSBjcmVhdGVBY2Nlc3NLZXlSZXNwb25zZS5BY2Nlc3NLZXk/LkFjY2Vzc0tleUlkO1xuICAgIGNvbnN0IHNlY3JldEFjY2Vzc0tleSA9IGNyZWF0ZUFjY2Vzc0tleVJlc3BvbnNlLkFjY2Vzc0tleT8uU2VjcmV0QWNjZXNzS2V5O1xuICAgIGNvbnNvbGUubG9nKFwiSUFNIFJvbGUgd2l0aCBmdWxsIGFkbWluaXN0cmF0aXZlIGFjY2VzcyBjcmVhdGVkXCIpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1czogMjAwLFxuICAgICAgZGF0YToge1xuICAgICAgICBhY2NvdW50SWQsXG4gICAgICAgIGFjY2Vzc0tleUlkLFxuICAgICAgICBzZWNyZXRBY2Nlc3NLZXksXG4gICAgICB9LFxuICAgIH07XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY3JlYXRpbmcgT1Ugb3IgYWNjb3VudDpcIiwgZXJyb3IpO1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXM6IDUwMCxcbiAgICAgIGRhdGE6IG51bGwsXG4gICAgICBlcnJvcjogZXJyb3JcbiAgICB9O1xuICB9XG59OyJdfQ==