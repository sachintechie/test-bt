import { getOrders } from "../db/dbFunctions";
import { OrderFindBy } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const { status, value, searchBy, page, perPage } = event.arguments?.input || {};
    const orderstatus = status || "ALL";

    let searchByEnum: OrderFindBy | undefined;
    let searchValue: string | undefined = value;

    const currentPage = page && page > 0 ? page : 1;
    const itemsPerPage = perPage && perPage > 0 ? perPage : 10;

    const searchByEnumMapping: Record<string, OrderFindBy | undefined> = {
      PRODUCT: OrderFindBy.PRODUCT,
      BUYER: OrderFindBy.BUYER,
      SELLER: OrderFindBy.SELLER,
      ORDER: OrderFindBy.ORDER,
      TENANT: OrderFindBy.TENANT,
    };

    searchByEnum = searchByEnumMapping[searchBy];

    if (searchByEnum) {
      if (searchByEnum === OrderFindBy.TENANT) {
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

    const { orders, totalCount } = await getOrders(offset, itemsPerPage, searchValue, searchByEnum, orderstatus);

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return {
      status: 200,
      data: orders,
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
