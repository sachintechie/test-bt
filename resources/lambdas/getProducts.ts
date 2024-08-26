import { getProducts } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const products = await getProducts();
    return {
      status: 200,
      data: products,
      error: null
    };
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};
