import { getRefWithSteps } from "../db/adminDbFunctions";
import { tenant } from "../db/models";

export const handler = async (event: any) => {
  try {
    console.log(event);

    const data = await getStepsByRefId(
    //  event.identity.resolverContext as tenant,
      event.arguments?.input?.refId
    );
    const projectData = {
      status: data.project != null ? 200 : 400,
      data: data.project,
      error: data.project == null ? data.error : null
    };

    console.log("project", projectData);

    return projectData;
  } catch (err) {
    console.log("In catch Block Error", err);
    return {
      status: 400,
      data: null,
      error: err
    };
  }
};

async function getStepsByRefId( refId: string) {
  console.log("refId", refId);

  try {
    const ref = await getRefWithSteps(refId);
    if (ref.error) {
      return {
        project: null,
        error: ref.error
      };
    } else {
      return {
        project: ref.data,
        error: null
      };
    }
  } catch (err) {
    console.log(err);
    return {
      project: null,
      error: err
    };
  }
}

