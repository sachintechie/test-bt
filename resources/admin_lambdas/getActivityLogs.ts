import { getActivityLogs } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any, context: any) => {
  try {
    console.log(event, context);


    // Fetch activity logs
    const activityLogs = await getActivityLogs();

    return {
      status: 200,
      data: activityLogs,
      error: null
    };
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      status: 500,
      data: null,
      error: errorMessage,
    };
  }
};
