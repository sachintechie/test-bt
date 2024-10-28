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

<<<<<<< Updated upstream
    if (event.arguments?.input?.chainType === "Avalanche") {
      const hash = await storeHash(event.arguments?.input?.hash, event.arguments?.input?.chainType);

      const response = {
        status: hash?.data != null ? 200 : 400,
        data: hash?.data,
        error: hash?.error
      };
      return response;
    } 
    else if (event.arguments?.input?.chainType === "Provenance") {
      const hash = await storeHash(event.arguments?.input?.hash, event.arguments?.input?.chainType);

      const response = {
        status: hash?.data != null ? 200 : 400,
        data: hash?.data,
        error: hash?.error
      };
      return response;
    } 
    
    else {
      return {
        status: 400,
        data: null,
        error: "ChainType not supported"
      };
=======
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
>>>>>>> Stashed changes
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
