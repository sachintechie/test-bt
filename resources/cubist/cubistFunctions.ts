import { deleteCustomer, deleteWallet, getCubistConfig } from "../db/dbFunctions";
import { deleteCubistUserKey, getCsClient, getCsClientBySecretName } from "./CubeSignerClient";

const cubsitApiEndpoint = process.env["CS_API_ENDPOINT"] ?? "https://gamma.signer.cubist.dev/";

export async function deleteKeyAndUser(customerWallets: any[], tenant: any) {
  try {
    const cubist = await deleteCubistUserKey(customerWallets, tenant.id);
    if ( cubist.user != null) {
     
return cubist;
    }

    return null;
 
  } catch (err) {
    console.log(err);
    throw err;
  }
}


/**
 * Use a CubeSigner token from AWS Secrets Manager to retrieve information
 * about the current user
 */
export async function getCubistOrgData( tenantId: string,) {
  try {
    const cubistConfig = await getCubistConfig(tenantId);
    if (cubistConfig == null) {
      return { key: null, error: "Cubist config not found for this tenant" };
    }
    const {org} = await getCsClient(tenantId);
    if(org != null ){
    const keys = (await org.keys()).length;

   const users = (await org.users()).length;
   console.log("total org user",users,"total org keys",keys);
    return {  data:{users,wallets:keys},error: null };
    }
    else{
      return {  data:null,error: "Error in getting org data" };
    }
  } catch (err) {
    console.error(err);
    return { key: null, error: "Erorr in creating cubist client for gas payer" };
  }
}


export async function sendOidcEmailOtp( emailId: string, tenantId: string) {
  const secretName = "";
  const cubistConfig = await getCubistConfig(tenantId);


  if(cubistConfig == null){
    return { data: null, error: "Cubist config not found for this tenant" };
  }else{
    const cubistTokenString: any = await getSecretValue(cubistConfig?.sendtokensecretname);
    console.log("cubistTokenString",cubistTokenString);
    const cubistToken = JSON.parse(cubistTokenString);
    console.log("cubistToken",cubistToken);
const endpoint = `${cubsitApiEndpoint}/v0/org/${cubistConfig?.orgid}/oidc/email-otp`;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization":  cubistToken
      },
      body: JSON.stringify({
        email: emailId
      })
    });
    const data= await response.json();
    return { data, error: null };
  } catch (err) {
    console.error(err);
    return { data: null, error: "Error in sending email otp" };
  }
}
}
function getSecretValue(secretName: any): any {
  throw new Error("Function not implemented.");
}

