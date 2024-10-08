import { getProducts } from "../db/dbFunctions";
import { ProductFindBy } from "../db/models";
 
export const handler = async (event: any) => {
  try {
    console.log(event);
    
    const { status, value, searchBy } = event.arguments?.input || {};
    const productStatus = status || 'ALL';

    let searchByEnum: ProductFindBy | undefined;
    let searchValue: string | undefined = value;  // Default to the input value


    if (searchBy === 'Product') {
      searchByEnum = ProductFindBy.Product;
      if (!value) throw new Error("Product ID is required when searchBy is 'Product'");
    } else if (searchBy === 'Category') {
      searchByEnum = ProductFindBy.Category;
      if (!value) throw new Error("Category ID is required when searchBy is 'Category'");
    } else if (searchBy === 'Tenant') {
      searchByEnum = ProductFindBy.Tenant;
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
