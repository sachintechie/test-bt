import { Connection, PublicKey, StakeProgram, Keypair,Authorized } from "@solana/web3.js";
import * as cs from "@cubist-labs/cubesigner-sdk";
import {oidcLogin, getPayerCsSignerKey, signTransaction} from "./CubeSignerClient";
import { getSolConnection } from "./solanaTransfer";
const ORG_ID = process.env["ORG_ID"]!;
const VALIDATOR_KEY = process.env["VALIDATOR_KEY"]!;
const env: any = {
  SignerApiRoot: process.env["CS_API_ROOT"] ?? "https://gamma.signer.cubist.dev"
};

export async function stakeSol(
  senderWalletAddress: string,
  receiverWalletAddress: string,
  amount: number,
  decimalPrecision: number,
  oidcToken: string,
  chainType: string,
  contractAddress: string,
  tenantId: string
) {
  const connection = await getSolConnection();
  const senderAddress = new PublicKey(senderWalletAddress);
  const validatorAddress = new PublicKey(VALIDATOR_KEY);
  let stakeAccountPubkey = await findExistingStakeAccount(connection,senderAddress);


  const payerKey = await getPayerCsSignerKey(chainType, tenantId);
  if (payerKey.key == null) {
    return {
      trxHash: null,
      error: payerKey.error}
  }
  const payerPublicKey = new PublicKey(payerKey.key.materialId);
  //Check sol balance on payer address
  const payerSolBalance = await connection.getBalance(payerPublicKey);
  if(payerSolBalance < 0.05){
    return {
      trxHash: null,
      error: "Insufficient balance in payer account"
    }
  }

  const oidcClient = await oidcLogin(env, ORG_ID, oidcToken, ["sign:*"]);
  if (!oidcClient) {
    return {
      trxHash: null,
      error: "Please send a valid identity token for verification"
    };
  }
  const keys = await oidcClient.sessionKeys();
  const senderKey = keys.filter((key: cs.Key) => key.materialId === senderWalletAddress)[0];

  if (!stakeAccountPubkey) {
    // Create a new stake account if none exists
    const stakeAccount = Keypair.generate();
    stakeAccountPubkey = stakeAccount.publicKey;


    // Transaction to create and initialize a stake account
    const createStakeAccountTx = StakeProgram.createAccount({
      fromPubkey: senderAddress,
      authorized: new Authorized(senderAddress, senderAddress),
      lamports: 0,
      stakePubkey: stakeAccountPubkey,
    });

    createStakeAccountTx.feePayer=payerPublicKey;

    const { blockhash } = await connection.getRecentBlockhash();
    createStakeAccountTx.recentBlockhash = blockhash;

    await signTransaction(createStakeAccountTx,payerKey.key);
    await signTransaction(createStakeAccountTx,senderKey);

    const txHash = await connection.sendRawTransaction(createStakeAccountTx.serialize());
    console.log(`txHash: ${txHash}`);
  }

  // Transaction to delegate stake to a validator
  const delegateStakeTx = StakeProgram.delegate({
    stakePubkey: stakeAccountPubkey,
    authorizedPubkey: senderAddress,
    votePubkey: validatorAddress,
  });

  delegateStakeTx.feePayer=payerPublicKey;

  const { blockhash } = await connection.getRecentBlockhash();
  delegateStakeTx.recentBlockhash = blockhash;

  await signTransaction(delegateStakeTx,payerKey.key);
  await signTransaction(delegateStakeTx,senderKey);

  const txHash = await connection.sendRawTransaction(delegateStakeTx.serialize());
  console.log(`txHash: ${txHash}`);
  return { trxHash: txHash, error: null };
}

// Function to find an existing stake account
async function findExistingStakeAccount(connection:Connection, address:PublicKey) {
  const accounts = await connection.getParsedProgramAccounts(
   StakeProgram.programId,
    {
      filters: [
        {
          dataSize: StakeProgram.space,
        },
        {
          memcmp: {
            offset: 12,
            bytes: address.toBase58(),
          },
        },
      ],
    }
  );

  return accounts.length > 0 ? accounts[0].pubkey : null;
}