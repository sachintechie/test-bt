import {getSolConnection} from "../solana/solanaFunctions";
import {getCubistConfig, getStakeAccountPubkeys} from "../db/dbFunctions";
import {mergeStakeAccounts} from "../solana/solanaStake";
import {tenant} from "../db/models";
import {getCubistKey} from "../cubist/CubeSignerClient";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
export const handler = async (event: any) => {
  const walletAddress=event.arguments?.input?.senderWalletAddress;
  const tenant= event.identity.resolverContext as tenant;
  const tenantId=tenant.id;
  const oidcToken=event.headers?.identity;
  const cubistConfig = await getCubistConfig(tenant.id);
  if (cubistConfig == null) {
    return {
      transaction: null,
      error: "Cubist Configuration not found for the given tenant"
    };
  }
  const cubistOrgId=cubistConfig.orgid;

  const connection = await getSolConnection();
  const stakeAccounts=await getStakeAccountPubkeys(walletAddress, tenantId);
  try{
    const key=await getCubistKey(env,cubistOrgId, oidcToken, ["sign:*"], walletAddress);
    await mergeStakeAccounts(connection, stakeAccounts, key);
    return {
      status: 200,
      data: "Merged"
    };
  }catch (e) {
    return {
      status: 400,
      data: null,
      error: e
    };
  }
};
