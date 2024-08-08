import { deleteCustomer, deleteWallet, getCubistConfig } from "../db/dbFunctions";
import { deleteCubistUserKey, getCsClient, getCsClientBySecretName } from "./CubeSignerClient";

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

