import { filterProducts } from "../db/dbFunctions";
import { productfilter } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const inputFilters = event.arguments?.input?.filters || [];

    const filters: productfilter[] = [];

    inputFilters.forEach((filter: any) => {
      const { key, operator, value } = filter;

     
      filters.push({
        key,
        operator,
        value: key === "price" ? parseFloat(value) : value  
      });
    });


    const products = await filterProducts(filters);

    return {
      status: 200,
      data: products,
      error: null,
    };
  } catch (error) {
    console.error("Error filtering products:", error);
    return {
      status: 500,
      data: null,
      error: "Internal Server Error",
    };
  }
};
