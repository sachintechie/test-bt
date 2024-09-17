import { getCollectionById } from "../db/dbFunctions";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const collectionId = event.arguments?.input?.collectionId;
    const collection = await getCollectionById(collectionId);
    return {
      status: 200,
      data: collection,
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
