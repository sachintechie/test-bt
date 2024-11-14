import * as cs from "@cubist-labs/cubesigner-sdk";
import { SigningStargateClient, StargateClient } from "@cosmjs/stargate";
import { CosmosSecp256k1CubeSigner } from "./walletProvider";

// response object for the sendTokens function

export interface SendTokensResponse {
  data: {
    message: string;
    transactionId: string;
    status: number;
    metaData: any;
    blockHash: string;
    type: string;
    timestamp: number;
    blockNumber: number;
    confirmations: number;
    from: string;
    to: string;
    gasLimit: string;
    gasPrice: string;
    gas: string;
    nonce: string;
    chainId: string;
    chainType: string;
  };
  error: any;
}

export class ProvenanceClient {
  private readonly rpcUrl: string;
  private readonly key: cs.Key;

  constructor(rpcUrl: string, key: cs.Key) {
    this.rpcUrl = rpcUrl;
    this.key = key;
  }

  async getStargateClient(): Promise<StargateClient> {
    return await StargateClient.connect(this.rpcUrl);
  }

  async getSigningStargateClient(): Promise<SigningStargateClient> {
    return await SigningStargateClient.connectWithSigner(this.rpcUrl, new CosmosSecp256k1CubeSigner(this.key), {
      // TODO: Set gas price to a reasonable value
      gasPrice: {
        amount: "0.025" as any,
        denom: "nhash"
      }
    });
  }

  async getBalance(address: string, denom: string): Promise<string> {
    const client = await this.getStargateClient();
    const balance = await client.getBalance(address, denom);
    return balance.amount;
  }

  async sendTokens(sender: string, recipient: string, amount: string, denom: string): Promise<SendTokensResponse> {
    try {
      const client = await this.getSigningStargateClient();
      const result = await client.sendTokens(
        sender,
        recipient,
        [
          {
            denom: denom,
            amount: amount
          }
        ],
        "auto",
        "Provenance Transfer"
      );

      if (result.code !== 0) {
        throw new Error(`Failed to send tokens: ${result.code}`);
      }
      return {
        data: {
          message: "Transaction successful!",
          transactionId: result.transactionHash,
          status: result.code,
          metaData: undefined,
          blockHash: undefined as any,
          type: undefined as any,
          timestamp: Math.floor(Date.now() / 1000),
          blockNumber: result.height,
          confirmations: undefined as any,
          from: sender,
          to: recipient,
          gasLimit: result.gasWanted.toString(),
          gasPrice: result.gasUsed.toString(),
          gas: result.gasUsed.toString(),
          nonce: undefined as any,
          chainId: undefined as any,
          chainType: "Provenance"
        },
        error: null
      };
    } catch (error: any) {
      console.error("Error sending tokens:", error);
      throw error;
    }
  }
}
