import { getCategories } from "../db/dbFunctions";
import { CategoryFindBy } from "../db/models";
export const handler = async (event: any) => {
  try {
    console.log(event);
    const { value, searchBy } = event.arguments?.input || {};

    let searchByEnum: CategoryFindBy | undefined;
    let searchValue: string | undefined = value;
    
    if (searchBy === 'CATEGORY') {
      searchByEnum = CategoryFindBy.CATEGORY;
      if (!value) throw new Error("Category ID is required when searchBy is 'CATEGORY'");
    } else if (searchBy === 'TENANT') {
      searchByEnum = CategoryFindBy.TENANT;
      searchValue = event.identity?.resolverContext?.id;
      if (!searchValue) throw new Error("Tenant ID is missing in resolverContext");
    }
    if (!searchBy && !value) {
      searchByEnum = undefined;
      searchValue = undefined;
    }

    const categories = await getCategories(searchValue, searchByEnum);
    return {
      status: 200,
      data: categories,
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
