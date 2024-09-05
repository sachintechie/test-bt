import { AuthType, tenant } from "../db/models";
import { createCustomer, getEmailOtpCustomer, updateCustomer } from "../db/dbFunctions";
import { sendOidcEmailOtp } from "../cubist/cubistFunctions";



export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const data = await createUser(
      event.identity.resolverContext as tenant,
      event.arguments?.input?.tenantUserId,
      event.arguments?.input?.emailid
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

async function createUser(tenant: tenant, tenantuserid: string, emailid: string) {
  console.log("Creating user");

  try {
    console.log("createUser", tenant.id, tenantuserid);
    const customer = await getEmailOtpCustomer(tenantuserid, tenant.id);

    if (customer != null ) {
      const sendMailResponse = await sendOidcEmailOtp(emailid,tenant.id);

      if(sendMailResponse.data){

        const updatedCustomer = await updateCustomer({
          id:customer.id,
          partialtoken: sendMailResponse.data?.partial_token,
          updatedat: new Date().toISOString()
        });
        return { customer, error: null };

      }
      else{
        return { customer: null, error: sendMailResponse.error };
      }

    } else {
      if (!emailid) {
        return {
          customer: null,
          error: "Please provide an emailId for verification"
        };
      } else {
        try {
          const sendMailResponse = await sendOidcEmailOtp(emailid,tenant.id);

          // If user does not exist, create it
          if (sendMailResponse.data) {
            
            const customer = await createCustomer({
              emailid: emailid ? emailid : "",
              name:  "----",
              tenantuserid,
              tenantid: tenant.id,
              isactive: true,
              isBonusCredit: false,
              usertype:AuthType.OTP,
              partialtoken: sendMailResponse.data?.partial_token,
              createdat: new Date().toISOString()
            });
            console.log("Created customer", customer.id);
            const customerData = {
              cubistuserid: "",
              tenantuserid: tenantuserid,
              tenantid: tenant.id,
              emailid: emailid,
              id: customer.id,
              createdat: new Date().toISOString()
            };

            return { customer: customerData, error: null };
          } else {
            
              return {
                customer: null,
                error: sendMailResponse.error
              };
            
          }
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


