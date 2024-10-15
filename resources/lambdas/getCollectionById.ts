import { getCollectionById } from "../db/dbFunctions";
import { CollectionFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { value, searchBy, page, perPage } = event.arguments?.input || {};

    if (!searchBy && !value) {
      throw new Error("Input is required");
    }

    let searchByEnum: CollectionFindBy;
    let searchValue: string = value;

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    if (searchBy === "COLLECTION") {
      searchByEnum = CollectionFindBy.COLLECTION;
    } else if (searchBy === "CUSTOMER") {
      searchByEnum = CollectionFindBy.CUSTOMER;
    } else {
      throw new Error("Invalid searchBy value");
    }

    const offset = (currentPage - 1) * itemsPerPage;

    const { collections, totalCount } = await getCollectionById(offset, itemsPerPage, searchValue, searchByEnum);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: collections,
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
