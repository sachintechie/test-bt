import * as cs from "@cubist-labs/cubesigner-sdk";
import { toBech32 } from "@cosmjs/encoding";
import { rawSecp256k1PubkeyToRawAddress } from "@cosmjs/amino";
import { Secp256k1 } from "@cosmjs/crypto";

export function logWithTrace(...args: any[]): void {
  // Create an error to get the stack trace
  const stack = new Error().stack?.split("\n");
  let functionName = "anonymous";
  let location = "";

  if (stack && stack.length > 2) {
    // The third line usually contains the caller function information
    const stackLine = stack[2].trim();
    const functionNameMatch = stackLine.match(/at (\S+)/);
    const locationMatch = stackLine.match(/(.*):(\d+):(\d+)/);

    if (functionNameMatch && functionNameMatch[1]) {
      functionName = functionNameMatch[1];
    }

    if (locationMatch && locationMatch[1] && locationMatch[2] && locationMatch[3]) {
      location = `${locationMatch[1]}:${locationMatch[2]}:${locationMatch[3]}`;
    }
  }

  // Prepend the function name and location to the log message
  console.log(`[Function: ${functionName}] [Location: ${location}] -`, ...args);
}

export const CHAIN_TO_CHAIN_NAME_MAPPING = {
  ETHEREUM: "Ethereum",
  BITCOIN: "Bitcoin",
  AVALANCHE: "Avalanche",
  CARDANO: "Cardano",
  SOLANA: "Solana",
  STELLAR: "Stellar",
  PROVENANCE: "Provenance"
};

export function getKeyTypeBasedOnChainId(chainType: string): any {
  let keyType: any;
  switch (chainType) {
    case CHAIN_TO_CHAIN_NAME_MAPPING.ETHEREUM:
      keyType = cs.Secp256k1.Evm;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.BITCOIN:
      keyType = cs.Secp256k1.Btc;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.AVALANCHE:
      keyType = cs.Secp256k1.AvaTest;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.CARDANO:
      keyType = cs.Ed25519.Cardano;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.SOLANA:
      keyType = cs.Ed25519.Solana;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.STELLAR:
      keyType = cs.Ed25519.Stellar;
      break;
    case CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE:
      keyType = cs.Secp256k1.Cosmos;
      break;
    default:
      keyType = null;
  }
  return keyType;
}

export function deriveDisplayAddressForCustomChains(chainType: string, key: cs.Key): any {
  let displayAddress: any;
  switch (chainType) {
    case CHAIN_TO_CHAIN_NAME_MAPPING.PROVENANCE:
      displayAddress = toBech32("tp", rawSecp256k1PubkeyToRawAddress(Secp256k1.compressPubkey(Buffer.from(key.publicKey.slice(2), "hex"))));
      break;
    default:
      displayAddress = key.materialId;
  }
  return displayAddress;
}
