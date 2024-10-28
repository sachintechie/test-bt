import { getAllProjects, getFirstReferenceByProjectId, updateProjectStage, updateReferernces } from "../db/adminDbFunctions";
import { getKbStatus, syncKb } from "../knowledgebase/scanDataSource";
import { ProjectStage, ProjectStatusEnum } from "@prisma/client";

export const handler = async (event: any) => {
  try {
    const projects = await updateProjects();
    return {
      status: 200,
      data: projects,
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

async function updateProjects() {
  try {
    let updatedProjects = [];
    const projects = await getAllProjects();

    for (const project of projects) {
      const reference = await getFirstReferenceByProjectId(project.id);
      if (reference != null) {
        if (project.projectstage == ProjectStage.DATA_PREPARATION) {
          const status = await getKbStatus(project.knowledgebaseid, reference?.datasourceid ?? "");
          if (status == "AVAILABLE") {
            // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
            const updateProject = await updateProjectStage(project.id, ProjectStage.LLM_FINE_TUNING, ProjectStatusEnum.ACTIVE);
            const updateReference = await updateReferernces(project.id,true);
            console.log("updateReference",updateReference);

            updatedProjects.push(updateProject);
          }
        } else if (project.projectstage == ProjectStage.DATA_SELECTION) {
          const status = await getKbStatus(project.knowledgebaseid, reference?.datasourceid ?? "");
          if (status == "AVAILABLE") {
            (async () => {
              try {
                await syncKb(project.knowledgebaseid, reference?.datasourceid ?? "");
              } catch (error) {
                console.error("Error in async task:", error);
              }
            })();
            // const syncKbStatus = syncKb(project.knowledgebaseid,reference?.datasourceid ?? "");
            const updateProject = await updateProjectStage(project.id, ProjectStage.DATA_PREPARATION, ProjectStatusEnum.ACTIVE);
          

            updatedProjects.push(updateProject);
          }
        }
      }
    }

    return updatedProjects;
  } catch (err) {
    console.log(err);
    throw err;
  }
}
