import { OrganizationsClient, CreateOrganizationalUnitCommand, CreateAccountCommand, MoveAccountCommand, DescribeCreateAccountStatusCommand } from "@aws-sdk/client-organizations";
import {
  IAMClient,
  CreateRoleCommand,
  CreateAccessKeyCommand,
  AttachUserPolicyCommand
} from "@aws-sdk/client-iam";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";

const organizationsClient = new OrganizationsClient({ region: "us-east-1" });
const stsClient = new STSClient({ region: "us-east-1" });

const parentId = 'r-39nf'; // Replace with your root or parent OU ID
const roleName = 'OrganizationAccountAccessRole';


export const handler = async (event: any, context: any) => {
  const { ouName, accountName, email } = event.arguments?.input;
  try {
    console.log("Creating new OU and AWS account",event);
    // Step 1: Create the new OU
    const createOUCommand = new CreateOrganizationalUnitCommand({
      ParentId: parentId,
      Name: ouName,
    });
    const createOUResponse = await organizationsClient.send(createOUCommand);
    const newOUId = createOUResponse.OrganizationalUnit?.Id;
    console.log("Organizational Unit Created:", newOUId);

    // Step 2: Create the new AWS account
    const createAccountCommand = new CreateAccountCommand({
      Email: email,
      AccountName: accountName,
      RoleName: roleName,
    });
    const createAccountResponse = await organizationsClient.send(createAccountCommand);
    const createAccountStatusId = createAccountResponse.CreateAccountStatus?.Id;
    console.log("Account creation initiated:", createAccountStatusId);

    // Wait for account creation to complete
    let accountId: string | undefined;
    while (!accountId) {
      const statusResponse = await organizationsClient.send(new DescribeCreateAccountStatusCommand({
        CreateAccountRequestId: createAccountStatusId,
      }));
      const accountStatus = statusResponse.CreateAccountStatus;
      if (accountStatus?.State === 'SUCCEEDED') {
        accountId = accountStatus?.AccountId;
        console.log("Account Created:", accountId);
      } else if (accountStatus?.State === 'FAILED') {
        throw new Error(`Account creation failed: ${accountStatus?.FailureReason}`);
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds before checking again
    }

    // Step 3: Move the new account to the new OU
    if (newOUId && accountId) {
      const moveAccountCommand = new MoveAccountCommand({
        AccountId: accountId,
        SourceParentId: parentId,
        DestinationParentId: newOUId,
      });
      await organizationsClient.send(moveAccountCommand);
      console.log("Account moved to new OU:", newOUId);
    }

    // Step 4: Assume the role in the new account to create necessary IAM policies and roles
    const assumeRoleCommand = new AssumeRoleCommand({
      RoleArn: `arn:aws:iam::${accountId}:role/${roleName}`,
      RoleSessionName: 'NewAccountSession',
    });
    const assumeRoleResponse = await stsClient.send(assumeRoleCommand);
    const credentials = assumeRoleResponse.Credentials;

    const newIamClient = new IAMClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: credentials!.AccessKeyId!,
        secretAccessKey: credentials!.SecretAccessKey!,
        sessionToken: credentials!.SessionToken!,
      },
    });

    // Step 5: Create a role in the new account with full administrative access
    const createRoleCommand = new CreateRoleCommand({
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
    const attachUserPolicyCommand = new AttachUserPolicyCommand({
      UserName: 'AdminUser',
      PolicyArn: 'arn:aws:iam::aws:policy/AdministratorAccess',
    });
    await newIamClient.send(attachUserPolicyCommand);

    // Step 7: Create access keys for the new IAM user
    const createAccessKeyCommand = new CreateAccessKeyCommand({
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

  } catch (error) {
    console.error("Error creating OU or account:", error);
    return {
      status: 500,
      data: null,
      error: error
    };
  }
};