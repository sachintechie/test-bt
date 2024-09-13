import { tenant } from "../db/models";
import { createAdminUser, getAdminUser, getAdminUserByEmail } from "../db/adminDbFunctions";
import AWS from "aws-sdk";
const cognito = new AWS.CognitoIdentityServiceProvider();

const ADMIN_GROUP = process.env["ADMIN_GROUP"];

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.emailId,
      event.arguments?.input?.name,
      event.arguments?.input?.password
    );

    const response = {
      status: data.customer != null ? 200 : 400,
      data: data.customer,
      error: data.error
    };
    console.log("customer", response);

    return response;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function createUser(tenant: tenant, emailId: string, username: string, password: string) {
  console.log("Creating admin user");

  try {
    console.log("createUser", tenant.id, emailId);
    const customer = await getAdminUserByEmail(emailId, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      return { customer, error: null };
    } else {
      try {
        if (tenant.iscognitoactive && tenant.userpoolid) {
          // Define parameters for creating a new Cognito user
          const params: AWS.CognitoIdentityServiceProvider.AdminCreateUserRequest = {
            UserPoolId: tenant.userpoolid, // Replace with your Cognito User Pool ID
            Username: emailId ? emailId : "", // Username of the user to be created

            UserAttributes: [
              {
                Name: "email",
                Value: emailId ? emailId : "" // Optional: user's email address
              }
            ],
            MessageAction: "SUPPRESS", // Prevents the automatic email invitation
            TemporaryPassword: password // Set a temporary password
          };

          // Create the user in Cognito
          const createUserResponse = await cognito.adminCreateUser(params).promise();
          console.log("Created Cognito user", createUserResponse);
          // Optionally, set a permanent password for the user
          const setPasswordParams: AWS.CognitoIdentityServiceProvider.AdminSetUserPasswordRequest = {
            UserPoolId: tenant.userpoolid,
            Username: emailId ? emailId : "",
            Password: password,
            Permanent: true
          };

          await cognito.adminSetUserPassword(setPasswordParams).promise();
          // Define parameters for adding a user to the group
          const groupParams: AWS.CognitoIdentityServiceProvider.AdminAddUserToGroupRequest = {
            UserPoolId: tenant.userpoolid, // Replace with your Cognito User Pool ID
            Username: emailId ? emailId : "", // Username of the user to be added to the group
            GroupName: ADMIN_GROUP ? ADMIN_GROUP : "Admin" // Name of the group to add the user to
          };
          await cognito.adminAddUserToGroup(groupParams).promise();
        }
        const customer = await createAdminUser({
          emailid: emailId ? emailId : "",
          name: username ? username : username,
          tenantuserid: emailId ? emailId : "",
          tenantid: tenant.id,
          isactive: true,
          isBonusCredit: false,
          createdat: new Date().toISOString()
        });
        console.log("Created customer", customer.id);

        const customerData = {
          cubistuserid: null,
          tenantuserid: emailId ? emailId : "",
          tenantid: tenant.id,
          emailid: emailId,
          id: customer.id,
          createdat: new Date().toISOString()
        };

        return { customer: customerData, error: null };
      } catch (e) {
        console.log(`Not verified: ${e}`);
        return {
          customer: null,
          error: e
        };
      }
    }
  } catch (e) {
    console.log(`Not verified: ${e}`);
    return {
      customer: null,
      error: e
    };
  }
}
