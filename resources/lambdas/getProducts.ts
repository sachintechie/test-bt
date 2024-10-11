import { getProducts } from "../db/dbFunctions";
import { ProductFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { status, value, searchBy, page = 1, perPage = 10 } = event.arguments?.input || {};
    const productStatus = status || "ALL";

    // Default searchByEnum and searchValue
    let searchByEnum: ProductFindBy | undefined;
    let searchValue: string | undefined = value;

    // Handle searchBy logic
    if (searchBy === "PRODUCT") {
      searchByEnum = ProductFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === "CATEGORY") {
      searchByEnum = ProductFindBy.CATEGORY;
      if (!value) throw new Error("Category ID is required when searchBy is 'CATEGORY'");
    } else if (searchBy === "TENANT") {
      searchByEnum = ProductFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
    }

    const offset = (page - 1) * perPage;

    const { products, totalCount } = await getProducts(searchValue, searchByEnum, productStatus, offset, perPage);

    const totalPages = Math.ceil(totalCount / perPage);
    return {
      data: products,
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
