import { filterProducts } from "../db/dbFunctions";
import { productfilter } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    const queryParams = event.queryStringParameters || {};

    const filters: productfilter[] = [];

    for (const key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        const value = queryParams[key];
        let operator: "gt" | "lt" | "gte" | "lte" | "eq" = "eq";
        let parsedValue: string | number = value;

        if (value.startsWith(">=")) {
          operator = "gte";
          parsedValue = value.slice(2);
        } else if (value.startsWith("<=")) {
          operator = "lte";
          parsedValue = value.slice(2);
        } else if (value.startsWith(">")) {
          operator = "gt";
          parsedValue = value.slice(1);
        } else if (value.startsWith("<")) {
          operator = "lt";
          parsedValue = value.slice(1);
        }

        if (!isNaN(Number(parsedValue))) {
          parsedValue = Number(parsedValue);
        }

        filters.push({
          key,
          operator,
          value: parsedValue
        });
      }
    }

    if (filters.length === 0) {
      return {
        status: 400,
        data: null,
        error: "Invalid input"
      };
    }

    const products = await filterProducts(filters);

    return {
      status: 200,
      data: products,
      error: null
    };
  } catch (error) {
    return {
      status: 500,
      data: null,
      error: "Internal Server Error"
    };
  }
};
