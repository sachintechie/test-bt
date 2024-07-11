import {getSolConnection} from "../solana/solanaFunctions";
import {getCubistConfig, getStakeAccountPubkeys} from "../db/dbFunctions";
import {withdrawFromStakeAccounts} from "../solana/solanaStake";
import { getCubistKey} from "../cubist/CubeSignerClient";
import {tenant} from "../db/models";

const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export const handler = async (event: any) => {
  const walletAddress=event.arguments?.input?.senderWalletAddress;
  const tenant= event.identity.resolverContext as tenant;
  const tenantId=tenant.id;
  const oidcToken=event.request?.headers?.identity;
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
    await withdrawFromStakeAccounts(connection, stakeAccounts, key);
    return {
      status: 200,
      data: "Withdrawn"
    };
  }catch (e) {
    return {
      status: 400,
      data: null,
      error: e
    };
  }
};
