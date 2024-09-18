import * as cs from "@cubist-labs/cubesigner-sdk";
import { StakeAccountStatus, StakeType, tenant, TransactionStatus } from "../db/models";
import {
  getCubistConfig,
  getFirstWallet,
  insertStakeAccount,
  insertStakingTransaction
} from "../db/dbFunctions";

import { Avalanche, BinTools, Buffer } from "avalanche";
import { AVMAPI, KeyChain as AVMKeyChain, KeyChain, Tx,  } from "avalanche/dist/apis/avm";
import { Defaults, UnixNow } from "avalanche/dist/utils";
import { oidcLogin, signTransaction } from "../cubist/CubeSignerClient";
import { Key } from "@cubist-labs/cubesigner-sdk";
import { UnsignedTx, UTXOSet, GetUTXOsResponse, PlatformVMAPI, GetValidatorsAtResponse, KeyChain as PlatformVMKeyChain, Tx as PlatformVMTx } from "avalanche/dist/apis/platformvm";
import { getAvaxBalance,getAvaxConnection, verifyAvalancheTransaction } from "./commonFunctions";
import { InfoAPI } from "avalanche/dist/apis/info";


const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)



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
  lockupExpirationTimestamp: number,
  rewardAddresses: string[]
) {
  

  // 1. Check if oidcToken exists, if not return error
  if (!oidcToken)
    return {
      wallet: null,
      error: "Please send a valid identity token for verification"
    };
  // 2. Get Cubist Configuration, if not found return error
  const cubistConfig = await getCubistConfig(tenant.id);
  if (cubistConfig == null)
    return {
      transaction: null,
      error: "Cubist Configuration not found for the given tenant"
    };
  // 3. Get first wallet by wallet address, if not found return error
  const wallet = await getFirstWallet(senderWalletAddress, tenant, symbol);
  if (!wallet) {
    return {
      transaction: null,
      error: "Wallet not found for the given wallet address"
    };
  }

  // 4. Check the Symbol, if SOL then stake SOL, if not then return error
  if (symbol !== "AVAX") {
    return {
      transaction: null,
      error: "Symbol not Supported"
    };
  }
  // 5. Check customer ID, if not found return error
  if (!wallet.customerid) {
    return {
      transaction: null,
      error: "Customer ID not found"
    };
  }

  // 6. Get balance of the wallet, if balance is less than amount return error
  const balance = await getAvaxBalance(senderWalletAddress);
  if ( balance != null && balance < amount) {
    return {
      transaction: null,
      error: "Insufficient AVAX balance"
    };
  }

  
  // 7. Stake AVAX
  const tx = await stakeAvax(senderWalletAddress, amount, receiverWalletAddress, oidcToken, lockupExpirationTimestamp, cubistConfig.orgid, rewardAddresses);
  console.log("[avalancheStaking]tx:", tx);
  // 8. Check if transaction is successful, if not return error
  if (tx.error) {
    console.log("[avalancheStaking]tx.error:", tx.error);
    return {
      transaction: null,
      error: tx.error
    };
  }

  // 9. Verify the transaction and insert the stake account and staking transaction
  const transactionStatus = await verifyAvalancheTransaction(tx?.trxHash!);
  const txStatus = transactionStatus === "finalized" ? TransactionStatus.SUCCESS : TransactionStatus.PENDING;
  const stakeAccountStatus = StakeAccountStatus.OPEN;

  
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
  console.log("[AvalancheStaking]transaction:", transaction);
  return { transaction, error: null };
}

async function getValidatorStake(pchain: PlatformVMAPI, validatorNodeKey: string) {
  try {
   // Fetch current validators information
   const validatorInfo: GetValidatorsAtResponse = await pchain.getCurrentValidators() as GetValidatorsAtResponse;

   // Check if the 'validators' field exists
   if (!validatorInfo || !validatorInfo.validators) {
     throw new Error("No validators found in the response");
   }

   // Access the 'validators' array in the response
   const validators = Object.values(validatorInfo.validators);

   // Find the specific validator's uptime info
   const validator = validators.find((val: any) => val.nodeID === validatorNodeKey);

   if (!validator) {
     throw new Error(`Validator with node key ${validatorNodeKey} not found`);
   }

    // Retrieve the validator's own stake and total delegated stake
    const selfStaked = parseFloat(validator.stakeAmount) / 1e9; // Convert from nAVAX to AVAX
    const totalDelegated = parseFloat(validator.delegatorWeight) / 1e9; // Convert from nAVAX to AVAX

    return {
      selfStaked,
      totalDelegated,
    };
  } catch (error) {
    console.error("Error fetching validator stake: ", error);
    throw error;
  }
}

async function getValidatorDelegationFee(pchain: PlatformVMAPI, validatorNodeKey: string) {
  try {
    // Fetch current validators information
   const validatorInfo: GetValidatorsAtResponse = await pchain.getCurrentValidators() as GetValidatorsAtResponse;

   
   if (!validatorInfo || !validatorInfo.validators) {
     throw new Error("No validators found in the response");
   }

   const validators = Object.values(validatorInfo.validators);

   const validator = validators.find((val: any) => val.nodeID === validatorNodeKey);

   if (!validator) {
     throw new Error(`Validator with node key ${validatorNodeKey} not found`);
   }

    // Retrieve the delegation fee rate in percentage
    const delegationFeeRate = parseFloat(validator.delegationFee);
    
    return delegationFeeRate; // Already in percentage
  } catch (error) {
    console.error("Error fetching delegation fee rate: ", error);
    throw error;
  }
}

async function getValidatorUptime(pchain: PlatformVMAPI, validatorNodeKey: string) {
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
  cubistOrgId: string,
  rewardAddresses: string[]
) {
  try {
    const { xchain, pchain } = await getAvaxConnection();
    const networkID  = 1;
    const amountToStake = parseFloat(amount.toString());
    // Check staking parameters
    const MIN_VALIDATOR_STAKE = networkID === 1 ? 2000 : 1; // Mainnet or Fuji Testnet
    const MIN_DELEGATOR_STAKE = networkID === 1 ? 25 : 1;
    const MIN_VALIDATION_TIME = networkID === 1 ? 2 * 7 * 24 * 60 * 60 : 24 * 60 * 60; // 2 weeks or 24 hours
    const MAX_VALIDATION_TIME = networkID === 1 ? 365 * 24 * 60 * 60 : 365 * 24 * 60 * 60; // 1 year
    const MIN_DELEGATION_FEE_RATE = 2; // Minimum delegation fee rate (in percentage)
    const MAX_VALIDATOR_WEIGHT = 3000000; // Maximum 3 million AVAX or 5x validator stake



    if (amountToStake < MIN_VALIDATOR_STAKE && amountToStake < MIN_DELEGATOR_STAKE) {
      return {
        trxHash: null,
        error: "Stake amount does not meet the minimum requirement."
      };
    }
    
    const currentTime = Math.floor(Date.now() / 1000);
    const stakingDuration = lockupExpirationTimestamp - currentTime;

    if (stakingDuration < MIN_VALIDATION_TIME || stakingDuration > MAX_VALIDATION_TIME) {
      return {
        trxHash: null,
        error: "Staking duration does not meet the allowed range."
      };
    }

    // getting delegation fee rate check 
    const delegationFeeRate = await getValidatorDelegationFee(pchain, validatorNodeKey);
    if (delegationFeeRate < MIN_DELEGATION_FEE_RATE) {
      return {
        trxHash: null,
        error: "Delegation fee rate does not meet the minimum required rate of 2%."
      };
    }

    // Check maximum weight of validator
    const validatorStake = await getValidatorStake(pchain , validatorNodeKey); // Placeholder function
    const totalWeight = validatorStake.totalDelegated + validatorStake.selfStaked;
    const maxWeight = Math.min(MAX_VALIDATOR_WEIGHT, 5 * validatorStake.selfStaked);
    
    if (totalWeight > maxWeight) {
      return {
        trxHash: null,
        error: `Validator weight exceeds the limit. Total delegated + self-stake must not exceed ${maxWeight} AVAX.`
      };
    }

    //  can integrate the uptime check from your validator
    const validatorUptime = await getValidatorUptime(pchain, validatorNodeKey); // Placeholder function
    if (validatorUptime < 80) {
      return {
        trxHash: null,
        error: "Validator uptime is below 80%, staking reward may not be guaranteed."
      };
    }
   
    const oidcClient = await oidcLogin(env, cubistOrgId, oidcToken, ["sign:*"]);
    
    if (!oidcClient) {
      return {
        trxHash: null,
        stakeAccountPubKey: null,
        error: "Please send a valid identity token for verification"
      };
    }
    
    
    //Initialize CubeSigner client
    //const oidcClient = await cs.CubeSignerClient.create(await cs.defaultSignerSessionManager());
    
    // get token/signer info and establish signer session.
    //const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
    //const oidcClient = await cs.CubeSignerClient.create(session);
    
    
    const keys = await oidcClient.sessionKeys();
    if (keys.length === 0) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of the given wallet address"
      };
    }
    
    const senderKey = keys.find((key: cs.Key) => key.materialId === senderWalletAddress);
    if (!senderKey) {
      return {
        trxHash: null,
        error: "Given identity token is not the owner of the given wallet address"
      };
    }



    // using cubesigner client to creat stake transaction
    const staketransaction = await createStakeAccountWithStakeProgram(
      pchain,
      senderKey,
      amountToStake,
      validatorNodeKey, // Use validatorNodeKey directly as string
      lockupExpirationTimestamp,
      oidcClient,
      rewardAddresses
    );
    return { trxHash: staketransaction.txHash, stakeAccountPubKey: staketransaction.stakeAccountPubKey, error: null };
  } catch (err: any) {
    console.log(await err);
    return { trxHash: null, error: err };
  }
}


export async function createStakeAccountWithStakeProgram(
  pchain: PlatformVMAPI,
  senderKey: Key,
  amount: number,
  validatorNodeKey: string,
  lockupExpirationTimestamp: number,
  oidcClient: any,
  rewardAddresses: string[]
) {
   try { 
 // const { networkID } = await getAvaxConnection();
  const stakeAmountString: string = amount.toFixed(0); // Amount to stake in nAVAX (1 AVAX = 10^9 nAVAX)
  const startTime: number = UnixNow() + 60; // Start staking in 60 seconds
  const endTime: number = lockupExpirationTimestamp; // Use the provided expiration timestamp
  const pKeychain: PlatformVMKeyChain = pchain.keyChain();
  const pAddressStrings: string[] = pKeychain.getAddressStrings();
  
    

  const utxoResponse: GetUTXOsResponse = await pchain.getUTXOs(pAddressStrings);
  const utxoSet: UTXOSet = utxoResponse.utxos;

    // Build the Add Delegator Transaction
    const stakeTx: UnsignedTx = await pchain.buildAddDelegatorTx(
      utxoSet,
      pAddressStrings,
      pAddressStrings,
      pAddressStrings,
      stakeAmountString,
      startTime,
      endTime,
      validatorNodeKey,
      rewardAddresses
    );
    
    // Sign the transaction using Cubist Signer
    const signedTx: PlatformVMTx = await oidcClient.signTransaction(oidcClient, stakeTx );

    // Update and return signed transaction
    return { txHash: signedTx.toString(), stakeAccountPubKey: senderKey.publicKey.toString() };
  } catch (err: any) {
    console.log(err);
    return { txHash: null, error: err.message || "Failed to create stake account" };
}
}

  
