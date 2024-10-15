import { getCategories } from "../db/dbFunctions";
import { CategoryFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { value, searchBy, page, perPage } = event.arguments?.input || {};

    let searchByEnum: CategoryFindBy | undefined;
    let searchValue: string | undefined = value;

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    if (searchBy === "CATEGORY") {
      searchByEnum = CategoryFindBy.CATEGORY;
      if (!value) throw new Error("Category ID is required when searchBy is 'CATEGORY'");
    } else if (searchBy === "TENANT") {
      searchByEnum = CategoryFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
    }

    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const offset = (currentPage - 1) * itemsPerPage;

    const { categories, totalCount } = await getCategories(offset, itemsPerPage, searchValue, searchByEnum);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: categories,
      page: currentPage,
      perPage: itemsPerPage,
      totalRecordsCount: totalCount,
      totalPageCount: totalPages,
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
