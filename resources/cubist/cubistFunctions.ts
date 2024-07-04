import { deleteCustomer, deleteWallet } from "../db/dbFunctions";
import { deleteCubistUserKey } from "./CubeSignerClient";

export async function deleteKeyAndUser(customerWallets: any[], tenant: any) {
  try {
    const cubist = await deleteCubistUserKey(tenant.id,customerWallets);
    if ( cubist.user != null) {
     
return cubist;
    }

    return null;
 
  } catch (err) {
    console.log(err);
    throw err;
  }
}

