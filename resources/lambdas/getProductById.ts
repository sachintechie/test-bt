import { getProductById } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const productId = event.arguments?.input?.productId;
    const product = await getProductById(productId);
    return {
      status: 200,
      data: product,
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
