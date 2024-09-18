import { getReviewsByProductId } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const productId = event.arguments?.input?.productId;
    const review = await getReviewsByProductId(productId);
    return {
      status: 200,
      data: review,
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
