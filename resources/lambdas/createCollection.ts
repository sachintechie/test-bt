import { createCollection } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    const { customerId, title, description } = event.arguments?.input;

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
