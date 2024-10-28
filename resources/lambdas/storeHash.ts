import { storeHash as avalancheStoreHash } from "../avalanche/storeHashFunctions";
import { storeHash as provenanceStoreHash } from "../provenance/storeHashFunctions";

// Create an enum for the chain types
enum ChainType {
  Avalanche = "Avalanche",
  Provenance = "Provenance",
}

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { chainType, hash, uuid, mnemonic } = event.arguments?.input || {};

    let hashResult;

    switch (chainType) {
      case ChainType.Avalanche:
        hashResult = await avalancheStoreHash(hash);
        break;

      case ChainType.Provenance:
        hashResult = await provenanceStoreHash(uuid, hash, process.env.PROVANENCE_MNEMONIC || "");
        break;

      default:
        return {
          status: 400,
          data: null,
          error: "ChainType not supported",
        };
    }

    return {
      status: hashResult?.data ? 200 : 400,
      data: hashResult?.data,
      error: hashResult?.error,
    };

  } catch (err) {
    console.error("Error in handler:", err);
    return {
      status: 400,
      data: null,
      error: err.message || "An error occurred",
    };
  }
};
