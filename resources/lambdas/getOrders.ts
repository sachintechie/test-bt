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

    if (searchBy === "PRODUCT") {
      searchByEnum = OrderFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === "BUYER") {
      searchByEnum = OrderFindBy.BUYER;
      if (!value) throw new Error("Buyer ID is required when searchBy is 'BUYER'");
    } else if (searchBy === "SELLER") {
      searchByEnum = OrderFindBy.SELLER;
      if (!value) throw new Error("Seller ID is required when searchBy is 'SELLER'");
    } else if (searchBy === "ORDER") {
      searchByEnum = OrderFindBy.ORDER;
      if (!value) throw new Error("Order ID is required when searchBy is 'ORDER'");
    } else if (searchBy === "TENANT") {
      searchByEnum = OrderFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
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
