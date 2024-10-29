import { AccountData, DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { mnemonicToSeedSync } from "bip39"; 
import { GasPrice } from "@cosmjs/stargate";
import { MsgExecuteContractParams } from "@provenanceio/wallet-utils";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { toUtf8 } from "@cosmjs/encoding";

const PROVENANCE_CONTRACT_ADDRESS = process.env.PROVENANCE_CONTRACT_ADDRESS || ""; // Deployed contract address
const PROVENANCE_RPC_URL = process.env.PROVENANCE_RPC_URL || ""; // Provenance RPC URL

// Function to derive a wallet from a mnemonic
async function deriveWallet(mnemonic: string) {
    try {
        const seed = mnemonicToSeedSync(mnemonic);
        const key = new Uint8Array(seed.slice(0, 32));
        const wallet = await DirectSecp256k1Wallet.fromKey(key, "tp");
        const [account] = await wallet.getAccounts();
        console.log("Wallet Address:", account.address);
        return { wallet, account };
    } catch (error) {
        console.error("Error deriving wallet:", error);
        throw error;
    }
}

// Function to sign and broadcast the transaction
const signAndBroadcast = async (uuid: string, hash: string, wallet: DirectSecp256k1Wallet, account: AccountData) => {
    const client = await SigningCosmWasmClient.connectWithSigner(PROVENANCE_RPC_URL, wallet, {
        gasPrice: GasPrice.fromString("200000nhash"),
    });

    let msgExecuteContractParams: MsgExecuteContractParams = {
        contract: PROVENANCE_CONTRACT_ADDRESS,
        msg: toUtf8(JSON.stringify({
            store_hashed_data: {
                uuid: Array.from(Buffer.from(uuid.slice(2), "hex")), // Convert to Uint8Array
                hashed_data: Array.from(Buffer.from(hash.slice(2), "hex")), // Convert to Uint8Array
                timestamp: Math.floor(Date.now() / 1000), // Current timestamp in seconds
            },
        })),
        sender: account.address,
        fundsList: [],
    };

    const msg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract", // Ensure you use the correct type URL
        value: msgExecuteContractParams,
    };

    // Set the transaction fee
    const fee = {
        amount: [{ denom: "nhash", amount: "2857500000" }], // Adjust as needed
        gas: "1500000", // Adjust as needed
    };

    // Broadcast the transaction
    const result = await client.signAndBroadcast(account.address, [msg], "auto", `Transaction to store hash: ${hash}`);
    return result;
}


export const storeHash = async (uuid: string, hash: string, mnemonic: string) => {
    try {
        const { wallet, account } = await deriveWallet(mnemonic);
        const result = await signAndBroadcast(uuid, hash, wallet, account);
        if(result.code !== 0) {
            throw new Error(`Transaction failed with code: ${result.code}`);
        }
        return {
            data: {
              message: "Transaction successful!",
              transactionId: result.transactionHash,
              status: result.code,
              hash: hash,
              metaData: undefined,
              blockHash: undefined,
              type: undefined,
              timestamp: Math.floor(Date.now() / 1000),
              blockNumber: result.height,
              confirmations: undefined,
              from: account.address,
              to: undefined,
              gasLimit: result.gasWanted.toString(),
              gasPrice: result.gasUsed.toString(),
              gas: result.gasUsed.toString(),
              nonce: undefined,
              chainId: undefined,
              chainType: "Provenance"
            },
            error: null
        };
    } catch (error) {
        console.error("Error storing hash:", error);
        throw error;
    }
}