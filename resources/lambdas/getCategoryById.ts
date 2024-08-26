import { getCategoryById } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const category = await getCategoryById(
      event.arguments?.input?.categoryId,
    );
    return {
      status: 200,
      data: category,
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
