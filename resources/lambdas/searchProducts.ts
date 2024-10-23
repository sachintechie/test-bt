import { searchProducts } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const {searchKeyword} =  event.arguments?.input;

	if (!searchKeyword || searchKeyword.trim() === "") {
      return {
        status: 400,
        data: null,
        error: "Search keyword is required."
      };
    }
    const products = await searchProducts(searchKeyword);

    return {
      status: 200,
      data: products,
      error: null
    };
  } catch (err) {
    console.error("Error in catch block", err);

    return {
      status: 400,
      data: null,
      error: err || 'An error occurred'
    };
  }
};
