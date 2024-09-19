import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import { getCubistConfig, getFirstWallet, insertStakeAccount, insertStakingTransaction } from "../db/dbFunctions";
import { avm, pvm, evm, Context, utils, networkIDs } from "@avalabs/avalanchejs";
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
  receiverWalletAddress: string,
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
  const tx = await stakeAvax(senderWalletAddress, amount, receiverWalletAddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid);
  if (tx.error) return { transaction: null, error: tx.error };

  // 9. Verify the transaction status and log the transaction
  const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
  const txStatus = transactionStatus?.status === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;

  const transaction = await insertStakingTransaction(
    senderWalletAddress,
    receiverWalletAddress,
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
    tx?.stakeAccountPubKey?.toString() || "",
    "",
    StakeType.STAKE
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
    const validators = Object.values(validatorInfo.validators);
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

    const validators = Object.values(validatorInfo.validators);
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
    const validatorInfo: GetValidatorsAtResponse = await pchain.getCurrentValidators() as GetValidatorsAtResponse;

    // Check if the 'validators' field exists
    if (!validatorInfo || !validatorInfo.validators) {
      throw new Error("No validators found in the response");
    }

    const validators = Object.values(validatorInfo.validators);

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
    const networkID  = 1;
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
        const validatorStake = await getValidatorStake(pvmapi , validatorNodeKey); // Placeholder function
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
      lockupExpirationTimestamp,
      oidcClient
    );

    // Return transaction hash or error
    if (!staketransaction.txHash) return { trxHash: null, error: staketransaction.error };
    return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };

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
  lockupExpirationTimestamp: number,
  oidcClient: any
) {
  try {
    const stakeAmount = BigInt(amount * 1e9); // Convert amount to nAVAX (1 AVAX = 10^9 nAVAX)
    console.log("Stake Amount:", stakeAmount);
    const start = BigInt(Math.floor(Date.now() / 1000) + 60); // Stake starts in 60 seconds
    const end = BigInt(lockupExpirationTimestamp); // Stake ends at expiration timestamp
    const pAddressStrings: string = "P-" + senderKey.materialId;
    const context = await Context.getContextFromURI(process.env.AVAX_URL);
    console.log("context", context);
    // Get UTXOs and create staking transaction
    const { utxos } = await pvmapi.getUTXOs({ addresses: [pAddressStrings] });
    console.log("utxos", utxos);
    const stakeTx = pvm.newAddPermissionlessDelegatorTx(
      context,
      utxos,
      [utils.bech32ToBytes(pAddressStrings)],
      validatorNodeKey,
      networkIDs.PrimaryNetworkID.toString(),
      start,
      end,
      stakeAmount,
      [utils.bech32ToBytes(pAddressStrings)]
    );
    console.log("stakeTx", stakeTx);
    // Sign the transaction using Cubist Signer
    const signedTx = await oidcClient.signTransaction(oidcClient, stakeTx);
    console.log("Stake signedTx:", signedTx);
    const result = await pvmapi.issueSignedTx(signedTx.getSignedTx());
    console.log("Stake Transaction Result:", result);
    // Update and return signed transaction
    return { txHash: signedTx.toString(), stakeAccountPubKey: senderKey.publicKey.toString() };
    } catch (err: any) {
    console.error("Error creating staking transaction:", err);
    return { txHash: null, error: err.message};
  }
}
