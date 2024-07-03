import {getSolConnection} from "./solana/solanaFunctions";
import {getStakeAccountPubkeys, getWalletIdFromAddress} from "./db/dbFunctions";
import {mergeStakeAccounts} from "./solana/solanaStake";
import {getCsClient} from "./cubist/CubeSignerClient";

export const handler = async (event: any) => {
  const walletAddress=event.senderWalletAddress;
  const tenantId=event.tenantId;

  const connection = await getSolConnection();
  const stakeAccounts=await getStakeAccountPubkeys(walletAddress, tenantId);
  const keyId=await getWalletIdFromAddress(walletAddress);
  if(!keyId){
    return {
      status: 404,
      error: "Wallet not found"
    };
  }
  const {  org } = await getCsClient(tenantId);
  const key=await org.getKey(keyId)
  await mergeStakeAccounts(connection, stakeAccounts, key);
  return {
    status: 200,
    data: "Withdrawn"
  };
};
