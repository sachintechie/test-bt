import * as cs from "@cubist-labs/cubesigner-sdk";
import { tenant } from "../db/models";
import { getCsClient } from "../cubist/CubeSignerClient";
import { createAdminUser, getAdminUser } from "../db/adminDbFunctions";
import AWS from "aws-sdk";
const cognito = new AWS.CognitoIdentityServiceProvider();
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
const ADMIN_GROUP = process.env["ADMIN_GROUP"];

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.arguments?.input?.name,
      event.arguments?.input?.password,
      event.headers?.identity
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

async function createUser(tenant: tenant, tenantuserid: string, username: string, password: string, oidcToken: string) {
  console.log("Creating admin user");

  try {
    console.log("createUser", tenant.id, tenantuserid);
    const customer = await getAdminUser(tenantuserid, tenant.id);
    if (customer != null && customer?.cubistuserid) {
      return { customer, error: null };
    } else {
      if (!oidcToken) {
        return {
          customer: null,
          error: "Please provide an identity token for verification"
        };
      } else {
        try {
          const { client, org, orgId } = await getCsClient(tenant.id);
          if (client == null || org == null) {
            return {
              customer: null,
              error: "Error creating cubesigner client"
            };
          }
          console.log("Created cubesigner client", client);
          const proof = await cs.CubeSignerClient.proveOidcIdentity(env, orgId, oidcToken);

          console.log("Verifying identity", proof);

          await org.verifyIdentity(proof);

          console.log("Verified");

          //assert(proof.identity, "Identity should be set when proof is obtained using OIDC token");
          const iss = proof.identity!.iss;
          const sub = proof.identity!.sub;
          const email = proof.email;
          const name = proof.preferred_username;
          let cubistUserId;
          // If user does not exist, create it
          if (!proof.user_info?.user_id) {
            console.log(`Creating OIDC user ${email}`);
            cubistUserId = await org.createOidcUser({ iss, sub }, email, {
              name,
              memberRole: "Member"
            });
          } else {
            cubistUserId = proof.user_info?.user_id;
          }
          

          const customer = await createAdminUser({
            emailid: email ? email : "",
            name: name ? name : username,
            tenantuserid,
            tenantid: tenant.id,
            iss: iss,
            cubistuserid: cubistUserId,
            isactive: true,
            isBonusCredit: false,
            createdat: new Date().toISOString()
          });
          console.log("Created customer", customer.id);
          if(tenant.userpoolid){
            // Define parameters for creating a new Cognito user
            const params: AWS.CognitoIdentityServiceProvider.AdminCreateUserRequest = {
              UserPoolId: tenant.userpoolid, // Replace with your Cognito User Pool ID
              Username: customer.id, // Username of the user to be created
              UserAttributes: [
                {
                  Name: "email",
                  Value: email ? email : "" // Optional: user's email address
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
              Username: username,
              Password: password,
              Permanent: true
            };
  
            await cognito.adminSetUserPassword(setPasswordParams).promise();
            // Define parameters for adding a user to the group
            const groupParams: AWS.CognitoIdentityServiceProvider.AdminAddUserToGroupRequest = {
              UserPoolId: tenant.userpoolid, // Replace with your Cognito User Pool ID
              Username: username, // Username of the user to be added to the group
              GroupName: ADMIN_GROUP ? ADMIN_GROUP : "Admin" // Name of the group to add the user to
            };
            await cognito.adminAddUserToGroup(groupParams).promise();
          }
          const customerData = {
            cubistuserid: cubistUserId,
            tenantuserid: tenantuserid,
            tenantid: tenant.id,
            emailid: email,
            id: customer.id,
            createdat: new Date().toISOString()
          };

          return { customer: customerData, error: null };
        } catch (e) {
          console.log(`Not verified: ${e}`);
          return {
            customer: null,
            error: "Please send a valid identity token for verification"
          };
        }
      }
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}
