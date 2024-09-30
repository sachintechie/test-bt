import { searchProductsByName } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const {name} =  event.arguments?.input;
    const products = await searchProductsByName(name);

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
