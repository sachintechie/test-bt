import { getCollectionById } from "../db/dbFunctions";
import { CollectionFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { value, searchBy } = event.arguments?.input || {};

    if (!searchBy && !value) {
      throw new Error("Input is required")
      }
     
    let searchByEnum: CollectionFindBy;
    let searchValue: string = value;

    if (searchBy === 'COLLECTION') {
      searchByEnum = CollectionFindBy.COLLECTION;
    } else if (searchBy === 'CUSTOMER') {
      searchByEnum = CollectionFindBy.CUSTOMER;
    }
    else {
      throw new Error("Invalid searchBy value");
    }

   

    const collection = await getCollectionById(searchValue, searchByEnum);
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
