import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeType, tenant, TransactionStatus } from "../db/models";
import { getCubistConfig, getFirstWallet, insertStakingTransaction } from "../db/dbFunctions";
import * as ava from "@avalabs/avalanchejs";
import { Context, networkIDs } from "@avalabs/avalanchejs";
import { delay } from "@cubist-labs/cubesigner-sdk";
import { oidcLogin } from "../cubist/CubeSignerClient";
import { Key } from "@cubist-labs/cubesigner-sdk";
import { getAvaxBalance, getAvaxConnection, verifyAvalancheTransaction } from "./commonFunctions";
import { GetValidatorsAtResponse, PVMApi } from "@avalabs/avalanchejs/dist/vms/pvm";
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev" // Default API root if not set in env
};

export async function AvalancheStaking(
  tenant: tenant,
  senderWalletAddress: string,
  validatornodeaddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string,
  lockupExpirationTimestamp: number
) {
  // 1. Validate the OIDC token
  if (!oidcToken) return { wallet: null, error: "Please send a valid identity token for verification" };

  // 2. Fetch Cubist configuration for the tenant
  const cubistConfig = await getCubistConfig(tenant.id);
  if (!cubistConfig) return { transaction: null, error: "Cubist Configuration not found for the given tenant" };

  // 3. Retrieve sender wallet details
  const wallet = await getFirstWallet(senderWalletAddress, tenant, symbol);
  if (!wallet) return { transaction: null, error: "Wallet not found for the given wallet address" };

  // 4. Ensure the correct symbol (AVAX)
  if (symbol !== "AVAX") return { transaction: null, error: "Symbol not Supported" };

  // 5. Ensure customer ID is associated with the wallet
  if (!wallet.customerid) return { transaction: null, error: "Customer ID not found" };

  // 6. Check wallet balance
  const balance = await getAvaxBalance(senderWalletAddress);
  if (balance !== null && balance < amount) return { transaction: null, error: "Insufficient AVAX balance" };

  // 7. Validate the lockup expiration timestamp
  if (!lockupExpirationTimestamp || isNaN(lockupExpirationTimestamp)) {
    return { transaction: null, error: "Invalid or missing lockupExpirationTimestamp" };
  }

  // 8. Perform staking transaction
  const tx = await stakeAvax(senderWalletAddress, amount, validatornodeaddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid);
  if (tx.error) return { transaction: null, error: tx.error };

  // 9. Verify the transaction status and log the transaction
  const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
  const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

  const transaction = await insertStakingTransaction(
    senderWalletAddress,
    validatornodeaddress,
    amount,
    chainType,
    symbol,
    tx?.trxHash || "",
    tenant.id,
    wallet.customerid,
    wallet.tokenid,
    tenantUserId,
    process.env["AVALANCHE_NETWORK"] ?? "",
    txStatus,
    tenantTransactionId,
    "",
    "",
    StakeType.STAKE
  );

  return { transaction, error: null };
}

// Unstaking AVAX
export async function AvalancheUnstaking(
  tenant: tenant,
  senderWalletAddress: string,
  amount: number,
  symbol: string,
  oidcToken: string,
  tenantUserId: string,
  chainType: string,
  tenantTransactionId: string,
  validatornodeaddress: string
) {
  if (!oidcToken) return { wallet: null, error: "Please send a valid identity token for verification" };

  const cubistConfig = await getCubistConfig(tenant.id);
  if (!cubistConfig) return { transaction: null, error: "Cubist Configuration not found for the given tenant" };

  const wallet = await getFirstWallet(senderWalletAddress, tenant, symbol);
  if (!wallet) return { transaction: null, error: "Wallet not found for the given wallet address" };

  if (symbol !== "AVAX") return { transaction: null, error: "Symbol not Supported" };

  const balance = await getAvaxBalance(senderWalletAddress);
  if (balance !== null && balance < amount) return { transaction: null, error: "Insufficient AVAX balance" };

  const tx = await unstakeAvax(senderWalletAddress, amount, oidcToken, cubistConfig.orgid, validatornodeaddress);
  if (tx.error) return { transaction: null, error: tx.error };

  const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
  const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

  const transaction = await insertStakingTransaction(
    senderWalletAddress,
    senderWalletAddress,
    amount,
    chainType,
    symbol,
    tx?.trxHash || "",
    tenant.id,
    wallet.customerid,
    wallet.tokenid,
    tenantUserId,
    process.env["AVALANCHE_NETWORK"] ?? "",
    txStatus,
    tenantTransactionId,
    "",
    "",
    StakeType.UNSTAKE
  );

  return { transaction, error: null };
}

async function getValidatorStake(pchain: PVMApi, validatorNodeKey: string) {
  try {
    // Fetch and validate validators information from P-chain
    const validatorInfo: GetValidatorsAtResponse = (await pchain.getCurrentValidators()) as GetValidatorsAtResponse;

    if (!validatorInfo || !validatorInfo.validators) {
      throw new Error("No validators found in the response");
    }

    // Find the specific validator's stake details
    const validators: any[] = Object.values(validatorInfo.validators);
    const validator = validators.find((val: any) => val.nodeID === validatorNodeKey);

    if (!validator) throw new Error(`Validator with node key ${validatorNodeKey} not found`);

    // Convert from nAVAX to AVAX and return stake details
    const selfStaked = parseFloat(validator.stakeAmount) / 1e9;
    const totalDelegated = parseFloat(validator.delegatorWeight) / 1e9;

    return { selfStaked, totalDelegated };
  } catch (error) {
    console.error("Error fetching validator stake: ", error);
    throw error;
  }
}

async function getValidatorDelegationFee(pchain: PVMApi, validatorNodeKey: string) {
  try {
    // Fetch validators and ensure the validator exists
    const validatorInfo: GetValidatorsAtResponse = (await pchain.getCurrentValidators()) as GetValidatorsAtResponse;

    if (!validatorInfo || !validatorInfo.validators) throw new Error("No validators found in the response");

    const validators: any[] = Object.values(validatorInfo.validators);
    const validator = validators.find((val: any) => val.nodeID === validatorNodeKey);

    if (!validator) throw new Error(`Validator with node key ${validatorNodeKey} not found`);

    // Return the delegation fee rate
    return parseFloat(validator.delegationFee);
  } catch (error) {
    console.error("Error fetching delegation fee rate: ", error);
    throw error;
  }
}

async function getValidatorUptime(pchain: PVMApi, validatorNodeKey: string) {
  try {
    // Fetch current validators information
    const validatorInfo: GetValidatorsAtResponse = (await pchain.getCurrentValidators()) as GetValidatorsAtResponse;

    // Check if the 'validators' field exists
    if (!validatorInfo || !validatorInfo.validators) {
      throw new Error("No validators found in the response");
    }

    const validators: any[] = Object.values(validatorInfo.validators);

    const validator = validators.find((val: any) => val.nodeID === validatorNodeKey);

    if (!validator) {
      throw new Error(`Validator with node key ${validatorNodeKey} not found`);
    }

    // Return the weighted uptime (which is already a percentage)
    return parseFloat(validator.uptime);
  } catch (error) {
    console.error("Error fetching validator uptime: ", error);
    throw error;
  }
}

export async function stakeAvax(
  senderWalletAddress: string,
  amount: number,
  validatorNodeKey: string,
  oidcToken: string,
  lockupExpirationTimestamp: number,
  cubistOrgId: string
) {
  try {
    const { pvmapi } = await getAvaxConnection();

    // Validate staking parameters
    const amountToStake = parseFloat(amount.toString());
    const currentTime = Math.floor(Date.now() / 1000);
    const networkID = 1;
    const MIN_VALIDATOR_STAKE = networkID === 1 ? 2000 : 1; // Mainnet or Fuji Testnet
    const MIN_DELEGATOR_STAKE = networkID === 1 ? 1 : 1;
    const MIN_VALIDATION_TIME = networkID === 1 ? 2 * 7 * 24 * 60 * 60 : 24 * 60 * 60; // 2 weeks or 24 hours
    const MAX_VALIDATION_TIME = networkID === 1 ? 365 * 24 * 60 * 60 : 365 * 24 * 60 * 60; // 1 year
    const MIN_DELEGATION_FEE_RATE = 2; // Minimum delegation fee rate (in percentage)
    const MAX_VALIDATOR_WEIGHT = 3000000; // Maximum 3 million AVAX or 5x validator stake
    const stakingDuration = lockupExpirationTimestamp - currentTime;
    if (amountToStake < MIN_VALIDATOR_STAKE && amountToStake < MIN_DELEGATOR_STAKE) {
      return {
        trxHash: null,
        error: "Stake amount does not meet the minimum requirement."
      };
    }

    if (stakingDuration < MIN_VALIDATION_TIME || stakingDuration > MAX_VALIDATION_TIME) {
      return {
        trxHash: null,
        error: "Staking duration does not meet the allowed range."
      };
    }

    // Fetch validator fee rate and check if it meets the minimum requirement
    const delegationFeeRate = await getValidatorDelegationFee(pvmapi, validatorNodeKey);
    if (delegationFeeRate < 2) return { trxHash: null, error: "Delegation fee rate does not meet the minimum required rate of 2%" };

    // Check maximum weight of validator
    const validatorStake = await getValidatorStake(pvmapi, validatorNodeKey); // Placeholder function
    const totalWeight = validatorStake.totalDelegated + validatorStake.selfStaked;
    const maxWeight = Math.min(MAX_VALIDATOR_WEIGHT, 5 * validatorStake.selfStaked);

    if (totalWeight > maxWeight) {
      return {
        trxHash: null,
        error: `Validator weight exceeds the limit. Total delegated + self-stake must not exceed ${maxWeight} AVAX.`
      };
    }

    //  can integrate the uptime check from your validator
    const validatorUptime = await getValidatorUptime(pvmapi, validatorNodeKey); // Placeholder function

    // OIDC login and session management
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    if (!oidcClient) return { trxHash: null, error: "Invalid identity token" };

    // Find the sender's key within the session
    const keys = await oidcClient.sessionKeys();
    const senderKey = keys.find((key: cs.Key) => key.materialId === senderWalletAddress);
    if (!senderKey) return { trxHash: null, error: "Identity token does not match the sender's wallet address" };

    // Create staking transaction
    const staketransaction = await createStakeAccountWithStakeProgram(
      pvmapi,
      senderKey,
      amountToStake,
      validatorNodeKey,
      lockupExpirationTimestamp
    );

    // Return transaction hash or error
    if (!staketransaction.txHash) return { trxHash: null, error: staketransaction.error };
    return { trxHash: staketransaction.txHash, error: null };
  } catch (err: any) {
    console.error("Error staking AVAX:", err);
    return { trxHash: null, error: err.message || "Failed to stake AVAX" };
  }
}

export async function createStakeAccountWithStakeProgram(
  pvmapi: PVMApi,
  senderKey: Key,
  amount: number,
  validatorNodeKey: string,
  lockupExpirationTimestamp: number
) {
  try {
    const stakeAmount = BigInt(amount * 1e9); // Convert amount to nAVAX (1 AVAX = 10^9 nAVAX)

    console.log("Stake Amount:", stakeAmount);
    const start = BigInt(Math.floor(Date.now() / 1000) + 60); // Stake starts in 60 seconds
    const end = BigInt(lockupExpirationTimestamp); // Stake ends at expiration timestamp
    const pAddress: string = "P-" + senderKey.materialId;
    const context = await Context.getContextFromURI(process.env.AVAX_URL);
    console.log("context", context);
    // Get UTXOs and create staking transaction
    const { utxos } = await pvmapi.getUTXOs({ addresses: [pAddress] });
    console.log("utxos", utxos);
    const addressBytes = [ava.utils.bech32ToBytes(pAddress)];
    const networkID: string = networkIDs.PrimaryNetworkID.toString();

    const stakeTx = ava.pvm.newAddPermissionlessDelegatorTx(
      context,
      utxos,
      addressBytes,
      validatorNodeKey,
      networkID,
      start,
      end,
      stakeAmount,
      [ava.utils.bech32ToBytes(pAddress)]
    );
    const setStakeTx = ava.utils.bufferToHex(stakeTx.toBytes());
    const stakeTxSig = await senderKey.signSerializedAva("P", setStakeTx);
    console.log(stakeTxSig);
    stakeTx.addSignature(ava.utils.hexToBuffer(stakeTxSig.data().signature));
    console.log("Submitting P-chain import transaction");
    const stakeTxRes = await pvmapi.issueSignedTx(stakeTx.getSignedTx());
    await waitForPvmTxCommitted(stakeTxRes.txID);
    console.log(stakeTxRes);
    return { txHash: stakeTxRes.txID.toString() };
  } catch (err: any) {
    console.error("Error creating staking transaction:", err);
    return { txHash: null, error: err.message };
  }
}

export async function unstakeAvax(
  senderWalletAddress: string,
  amount: number,
  oidcToken: string,
  cubistOrgId: string,
  validatornodeaddress: string
) {
  try {
    const { pvmapi } = await getAvaxConnection();

    const amountToUnstake = BigInt(amount * 1e9); // Convert amount to nAVAX

    const pAddress: string = "P-" + senderWalletAddress;
    const context = await Context.getContextFromURI(process.env.AVAX_URL);

    const { utxos } = await pvmapi.getUTXOs({ addresses: [pAddress] });
    const addressBytes = [ava.utils.bech32ToBytes(pAddress)];
    const networkID: string = networkIDs.PrimaryNetworkID.toString();
    const subnets: number = Number(networkIDs.PrimaryNetworkID);

    // OIDC login and session management
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    if (!oidcClient) return { trxHash: null, error: "Invalid identity token" };

    const keys = await oidcClient.sessionKeys();
    const senderKey = keys.find((key: cs.Key) => key.materialId === senderWalletAddress);
    if (!senderKey) return { trxHash: null, error: "Identity token does not match the sender's wallet address" };

    // Create unstaking transaction
    // const unstakeTx = ava.pvm.newRemoveSubnetValidatorTx(
    //   context,
    //   utxos,
    //   addressBytes,
    //   networkID,
    //   [ava.utils.bech32ToBytes(pAddress)]
    // );
    const unstakeTx = ava.pvm.newRemoveSubnetValidatorTx(context, utxos, addressBytes, validatornodeaddress, networkID, [subnets]);
    const setUnstakeTx = ava.utils.bufferToHex(unstakeTx.toBytes());
    const unstakeTxSig = await senderKey.signSerializedAva("P", setUnstakeTx);
    unstakeTx.addSignature(ava.utils.hexToBuffer(unstakeTxSig.data().signature));

    const unstakeTxRes = await pvmapi.issueSignedTx(unstakeTx.getSignedTx());
    await waitForPvmTxCommitted(unstakeTxRes.txID);

    return { trxHash: unstakeTxRes.txID.toString() };
  } catch (err: any) {
    console.error("Error unstaking AVAX:", err);
    return { trxHash: null, error: err.message };
  }
}

async function waitForPvmTxCommitted(txId: string) {
  let status;
  const { pvmapi } = await getAvaxConnection();
  do {
    status = (await pvmapi.getTxStatus({ txID: txId })).status;
    await delay(100);
  } while (status !== "Committed");
}
