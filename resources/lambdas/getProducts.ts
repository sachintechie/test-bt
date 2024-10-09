import { getProducts } from "../db/dbFunctions";
import { ProductFindBy } from "../db/models";
 
export const handler = async (event: any) => {
  try {
    console.log(event);
    
    const { status, value, searchBy } = event.arguments?.input || {};
    const productStatus = status || 'ALL';

    let searchByEnum: ProductFindBy | undefined;
    let searchValue: string | undefined = value;  // Default to the input value


    if (searchBy === 'PRODUCT') {
      searchByEnum = ProductFindBy.PRODUCT;
      if (!value) throw new Error("Product ID is required when searchBy is 'PRODUCT'");
    } else if (searchBy === 'CATEGORY') {
      searchByEnum = ProductFindBy.CATEGORY;
      if (!value) throw new Error("Category ID is required when searchBy is 'CATEGORY'");
    } else if (searchBy === 'TENANT') {
      searchByEnum = ProductFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
    }
    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const products = await getProducts(searchValue, searchByEnum, productStatus);

    return {
      status: 200,
      data: products,
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
