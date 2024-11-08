import { getHashTransactionDetails } from "../avalanche/commonFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    if (event.arguments?.input?.chainType === "Avalanche") {
      const hash = await getHashTransactionDetails(event.arguments?.input?.transactionHash);

      const response = {
        status: hash?.data != null ? 200 : 400,
        data: hash?.data,
        error: hash?.error
      };
      return response;
    } else {
      return {
        status: 400,
        data: null,
        error: "ChainType not supported"
      };
    }
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
