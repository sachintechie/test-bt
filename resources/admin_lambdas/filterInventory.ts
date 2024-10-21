import { filterInventory } from "../db/adminDbFunctions";
import { inventoryfilter } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);

    const input = event.arguments?.input?.filters;

    const filters: inventoryfilter = {
      inventoryid: input?.inventoryId || undefined,
      productname: input?.productName || undefined,
      price: input?.price ? { operator: input.price.operator, value: Number(input.price.value) } : undefined,
      quantity: input?.quantity ? { operator: input.quantity.operator, value: Number(input.quantity.value) } : undefined,
    };

    if (filters.price && isNaN(filters.price.value)) {
      return {
        status: 400,
        data: null,
        error: "Invalid price value, must be a number."
      };
    }

    if (filters.quantity && isNaN(filters.quantity.value)) {
      return {
        status: 400,
        data: null,
        error: "Invalid quantity value, must be a number."
      };
    }

    const filteredResult = await filterInventory(filters);

    return {
      status: 200,
      data: filteredResult,
      error: null
    };
  } catch (error) {
    console.error("Error filtering inventory", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error: errorMessage,
    };
  }
};
