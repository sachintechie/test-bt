import { searchInventory } from "../db/adminDbFunctions";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);


    const { searchKeyword } = event.arguments?.input || {};


    if (!searchKeyword || searchKeyword.trim() === "") {
      return {
        status: 400,
        data: null,
        error: "Search keyword (either Inventory ID or Product Name) is required"
      };
    }


    const searchResult = await searchInventory(searchKeyword);

    return {
      status: 200,
      data: searchResult,
      error: null
    };
  } catch (error) {
    console.error("Error searching inventory", error);

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