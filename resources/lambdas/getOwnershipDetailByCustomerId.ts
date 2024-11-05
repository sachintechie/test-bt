import { getOwnershipDetailByCustomerId } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { customerId } = event.arguments?.input;

    if (!customerId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: customerId is required"
      };
    }

    const ownershipDetail = await getOwnershipDetailByCustomerId(customerId);

    if (!ownershipDetail) {
      return {
        status: 404,
        data: null,
        error: "No detail found for the given this customerId"
      };
    }

    return {
      status: 200,
      data: ownershipDetail,
      error: null
    };
  } catch (error) {
    console.error("Error retrieving ownershipDetail:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
