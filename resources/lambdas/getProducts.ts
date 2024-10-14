import { getProducts } from "../db/dbFunctions";
import { ProductFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    const { status, value, searchBy, page, perPage } = event.arguments?.input || {};
    const productStatus = status || "ALL";

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    let searchByEnum: ProductFindBy | undefined;
    let searchValue: string | undefined = value;

    const searchByEnumMapping: Record<string, ProductFindBy | undefined> = {
      PRODUCT: ProductFindBy.PRODUCT,
      BUYER: ProductFindBy.CATEGORY,
      SELLER: ProductFindBy.TENANT
    };

    searchByEnum = searchByEnumMapping[searchBy];

    if (searchByEnum) {
      if (searchByEnum === ProductFindBy.TENANT) {
        searchValue = event.identity?.resolverContext?.id;
        if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
      } else if (!value) {
        throw new Error(`${searchBy} ID is required when searchBy is '${searchBy}'`);
      }
    }

    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }
    
    const offset = (currentPage - 1) * itemsPerPage;

    const { products, totalCount } = await getProducts(offset, itemsPerPage, searchValue, searchByEnum, productStatus);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      data: products,
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
