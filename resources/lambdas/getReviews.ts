import { getReviews } from "../db/dbFunctions";
import { ReviewsFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { value, searchBy, page, perPage } = event.arguments?.input || {};

    let searchByEnum: ReviewsFindBy | undefined;
    let searchValue: string | undefined = value;

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

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

    const offset = (currentPage - 1) * itemsPerPage;

    const { reviews, totalCount } = await getReviews(offset, itemsPerPage, searchValue, searchByEnum);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      data: reviews,
      page: currentPage,
      perPage: itemsPerPage,
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
