import { getReviews } from "../db/dbFunctions";
import { ReviewsFindBy } from "../db/models";
 
export const handler = async (event: any) => {
  try {
    console.log(event);
    
    const { value, searchBy } = event.arguments?.input || {};
    
    let searchByEnum: ReviewsFindBy | undefined;
    let searchValue: string | undefined = value;  // Default to the input value


    if (searchBy === 'PRODUCT') {
      searchByEnum = ReviewsFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === 'CUSTOMER') {
      searchByEnum = ReviewsFindBy.CUSTOMER;
      if (!value) throw new Error("Customer ID is required when searchBy is 'CUSTOMER'");
    } 
    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const reviews = await getReviews(searchValue, searchByEnum);

    return {
      status: 200,
      data: reviews,
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
