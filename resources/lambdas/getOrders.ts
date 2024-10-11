import { getOrders } from "../db/dbFunctions";
import { OrderFindBy } from "../db/models";
 
export const handler = async (event: any) => {
  try {
    console.log(event);
    
    const { status, value, searchBy } = event.arguments?.input || {};
    const orderstatus = status || 'ALL';

    let searchByEnum: OrderFindBy | undefined;
    let searchValue: string | undefined = value;  // Default to the input value


    if (searchBy === 'PRODUCT') {
      searchByEnum = OrderFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === 'BUYER') {
      searchByEnum = OrderFindBy.BUYER;
      if (!value) throw new Error("Buyer ID is required when searchBy is 'BUYER'");
    }
    else if (searchBy === 'SELLER') {
      searchByEnum = OrderFindBy.SELLER;
      if (!value) throw new Error("Seller ID is required when searchBy is 'SELLER'");
    }
    else if (searchBy === 'ORDER') {
      searchByEnum = OrderFindBy.ORDER;
      if (!value) throw new Error("Order ID is required when searchBy is 'ORDER'");
    }
     else if (searchBy === 'TENANT') {
      searchByEnum = OrderFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
    }
    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const orders = await getOrders(searchValue, searchByEnum, orderstatus);

    return {
      status: 200,
      data: orders,
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
