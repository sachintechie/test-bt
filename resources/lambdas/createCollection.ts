import { createCollection } from "../db/dbFunctions";
import { tenant } from "../db/models";
export const handler = async (event: any, context: any) => {
  try {
    const { title, description } = event.arguments?.input;
    const tenant = event.identity.resolverContext as tenant;
    const customerId = tenant?.customerid;
    if (!customerId || !title || !description) {
      return {
        status: 400,
        data: null,
        error: "Customer ID, Title and Description must be provided."
      };
    }

    const data = {
      customerid: customerId,
      title,
      description
    };

    const collection = await createCollection(data);

    return {
      status: 200,
      data: collection,
      error: null
    };
  } catch (error) {
    console.error("Error adding product to collection:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error: errorMessage
    };
  }
};
