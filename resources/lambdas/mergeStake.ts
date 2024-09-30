import { getSolConnection } from "../solana/solanaFunctions";
import { getCubistConfig, getStakeAccountPubkeys, getStakeAccounts } from "../db/dbFunctions";
import { mergeStakeAccounts } from "../solana/solanaStake";
import { tenant } from "../db/models";
import { getCubistKey } from "../cubist/CubeSignerClient";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};
export const handler = async (event: any) => {
  const walletAddress = event.arguments?.input?.senderWalletAddress;
  const tenant = event.identity.resolverContext as tenant;
  const tenantId = tenant.id;
  const oidcToken = event.headers?.identity;
  const cubistConfig = await getCubistConfig(tenant.id);
  if (cubistConfig == null) {
    return {
      data: null,
      error: "Cubist Configuration not found for the given tenant"
    };
  }
  const cubistOrgId = cubistConfig.orgid;

  const connection = await getSolConnection();
  const stakeAccounts = await getStakeAccountPubkeys(walletAddress, tenantId);
  try {
    const key = await getCubistKey(env, cubistOrgId, oidcToken, ["sign:*"], walletAddress);
    await mergeStakeAccounts(connection, stakeAccounts, key);
    const accounts = await getStakeAccounts(walletAddress, tenantId);
    return {
      status: 200,
      data: accounts
    };
  } catch (e: any) {
    console.log(e);
    return {
      status: 400,
      data: null,
      error: e.message
    };
  }
};
