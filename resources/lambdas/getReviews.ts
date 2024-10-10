import { getReviews } from "../db/dbFunctions";
import { ReviewsFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { value, searchBy, page = 1, perPage = 10 } = event.arguments?.input || {};

    let searchByEnum: ReviewsFindBy | undefined;
    let searchValue: string | undefined = value;

    if (searchBy === "PRODUCT") {
      searchByEnum = ReviewsFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === "CUSTOMER") {
      searchByEnum = ReviewsFindBy.CUSTOMER;
      if (!value) throw new Error("Customer ID is required when searchBy is 'CUSTOMER'");
    }
    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const offset = (page - 1) * perPage;

    const { reviews, totalCount } = await getReviews(searchValue, searchByEnum, offset, perPage);

    const totalPages = Math.ceil(totalCount / perPage);

    return {
      data: reviews,
      page,
      perPage,
      totalRecordsCount: totalCount,
      totalPageCount: totalPages,
      status: 200,
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
