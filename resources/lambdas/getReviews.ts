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

    const searchByEnumMapping: Record<string, ReviewsFindBy | undefined> = {
      PRODUCT: ReviewsFindBy.PRODUCT,
      CUSTOMER: ReviewsFindBy.CUSTOMER
    };
    searchByEnum = searchByEnumMapping[searchBy];

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
