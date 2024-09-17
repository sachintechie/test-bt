import { getReviewsByCustomerId } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const customerId = event.arguments?.input?.customerId;
    const review = await getReviewsByCustomerId(customerId);
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
