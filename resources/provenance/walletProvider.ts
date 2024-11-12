import * as cs from "@cubist-labs/cubesigner-sdk";
import type { AccountData, DirectSignResponse, OfflineDirectSigner } from "@cosmjs/proto-signing";
import { makeSignBytes } from "@cosmjs/proto-signing";
import { sha256, Secp256k1 } from "@cosmjs/crypto";
import type { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { encodeSecp256k1Signature, rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino";
import { toBech32 } from "@cosmjs/encoding";

export class CosmosSecp256k1CubeSigner implements OfflineDirectSigner {
  private readonly signer: cs.CubeSignerClient;
  private readonly key: cs.Key;
  private readonly account: AccountData;

  /**
   * Create a new direct signer.
   *
   * This implementation is based on the DirectSecp256k1Wallet class from the @cosmjs/proto-signing package.
   *
   * @param {Key} key - The key to use for signing.
   */

  constructor(key: cs.Key) {
    this.account = CosmosSecp256k1CubeSigner.keyToAccountData(key);
  }

  /** inheritdoc */
  async getAccounts(): Promise<readonly AccountData[]> {
    return [this.account];
  }

  get address(): string {
    return toBech32("tp", rawSecp256k1PubkeyToRawAddress(this.account.pubkey));
  }

  /**
   * Sign a sign doc using the blob-sign end point.
   * @param {string} address The address to sign with (must be the same as the signer key).
   * @param {SignDoc} signDoc The sign doc to sign.
   * @return {DirectSignResponse} The signature.
   */
  async signDirect(address: string, signDoc: SignDoc): Promise<DirectSignResponse> {
    if (address !== this.account.address) {
      throw new Error(`Address ${address} does not match signer address ${this.account.address}`);
    }
    const signBytes = makeSignBytes(signDoc);
    const hashedMessage = sha256(signBytes);
    const resp = await this.key.signBlob({
      message_base64: Buffer.from(hashedMessage).toString("base64")
    });
    if (resp.requiresMfa()) {
      throw new Error("MFA support not implemented in this example");
    }
    // return the signature
    const signature = resp.data().signature;
    const signatureBytes = Secp256k1.trimRecoveryByte(Buffer.from(signature.slice(2), "hex"));
    const stdSignature = encodeSecp256k1Signature(this.account.pubkey, signatureBytes);
    return {
      signed: signDoc,
      signature: stdSignature
    };
  }

  /**
   * Convert a key to account data.
   * @param {cs.KeyInfo} key The key to convert.
   * @return {AccountData} The account data
   * @throws {Error} If the key is not a Secp256k1 Cosmos key.
   */
  static keyToAccountData(key: cs.Key): AccountData {
    return {
      algo: "secp256k1",
      address: "tp120crp04k8g5tkwjynvjjecw93d2dha3awcw0x2",
      pubkey: Secp256k1.compressPubkey(Buffer.from(key.publicKey.slice(2), "hex"))
    };
  }
}
