import { getAttributeById } from "../db/dbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const { attributeId } = event.arguments?.input;

    if (!attributeId) {
      return {
        status: 400,
        data: null,
        error: "Invalid input: attributeId is required"
      };
    }

    const attribute = await getAttributeById(attributeId);

    if (!attribute) {
      return {
        status: 404,
        data: null,
        error: "Attribute not found"
      };
    }

    return {
      status: 200,
      data: attribute,
      error: null
    };
  } catch (error) {
    console.error("Error retrieving attribute:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
