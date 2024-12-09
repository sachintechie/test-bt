// import { createStage, createStep, getStageType, getStepType } from "../db/adminDbFunctions";

// export async function addStage1(tenantUserId: string, projectId: string) {
//     const stageType = await getStageType("Data Source");
//     if (stageType) {

//     const stage1 = await createStage(tenantUserId, "Data Source", "Data Source", stageType.id, projectId, 1);
//     if (stage1) {
//       // Fetch step types for each action in the stage
//       const [stepType1, stepType2, stepType3] = await Promise.all([
//         getStepType("File upload from frontend"),
//         getStepType("File hashing"),
//         getStepType("Store to Blockchain")
//       ]);

//       if (stepType1 && stepType2 && stepType3) {
//         // Create steps for stage 1
//         const [step1, step2, step3] = await Promise.all([
//           createStep(tenantUserId, "File upload from frontend", "File upload from frontend", stepType1.id, stage1.id, 1),
//           createStep(tenantUserId, "File hashing", "File hashing", stepType2.id, stage1.id, 2),
//           createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage1.id, 3)
//         ]);
//         await addStage2(tenantUserId, projectId);
//         }
//     }
    
// }
// }

//  async function addStage2(tenantUserId: string, projectId: string) {
//     const stageType2 = await getStageType("Data Ingestion");

//     if (stageType2) {
//       const stage2 = await createStage(tenantUserId, "Data Ingestion", "Data Ingestion", stageType2.id, projectId, 2);


//         if (stage2) {
//           const stepType = await getStepType("Upload to S3");

//           if (stepType) {
//             const step1 = await createStep(tenantUserId, "Upload to S3", "Upload to S3", stepType.id, stage2.id, 1);
//             await addStage3(tenantUserId, projectId);

//           }
//         }
//     }
           
// }

//  async function addStage3(tenantUserId: string, projectId: string) {
//    // Stage 3: Data Storage
//    const stageType3 = await getStageType("Data Storage");
//    if (stageType3) {
//      const stage3 = await createStage(tenantUserId, "Data Storage", "Data Storage", stageType3.id, projectId, 3);

//      // Retrieve details from the previous ingestion stage
//    //  const ingestionStageDetails = await getStageDetails(projectId, stageType2?.id || "");
 
//       // const stepDetails = await getStepDetails(ingestionStageDetails.steps[0].id);
//        const [stepType1, stepType2, stepType3] = await Promise.all([
//          getStepType("Read file from s3"),
//          getStepType("Hashing of s3 file"),
//          getStepType("Store to Blockchain")
//        ]);

//        if (stepType1 && stepType2 && stepType3) {
//          const [step1, step2, step3] = await Promise.all([
//            createStep(tenantUserId, "Read file from s3", "Read file from s3", stepType1.id, stage3.id, 1),
//            createStep(tenantUserId, "Hashing of s3 file", "Hashing of s3 file", stepType2.id, stage3.id, 2),
//            createStep(tenantUserId, "Store to Blockchain", "Store to Blockchain", stepType3.id, stage3.id, 3)
//          ]);
//          await addStage4(tenantUserId, projectId);

//         }
//     }
// }


//  async function addStage4(tenantUserId: string, projectId: string) {
//     const stageType4 = await getStageType("Data Preparation");
//     if (stageType4) {
//       const stage4 = await createStage(tenantUserId, "Data Preparation", "Data Preparation", stageType4.id, projectId, 4);

//       // const sourceStageDetails = await getStageDetails(projectId, stageType1?.id || "");
//         //  const fileUploadStepId = sourceStageDetails.steps.filter((step) => step.name === "File upload from frontend")[0].id;
//         // const stepDetails = await getStepDetails(fileUploadStepId);

//         // Retrieve details from the previous ingestion stage
//         //  const stepDetails = await getStageDetailsByProjectId(projectId);
//         const [stepType1, stepType2, stepType3, stepType4, stepType5, stepType6, stepType7] = await Promise.all([
//           getStepType("Chunking"),
//           getStepType("Chunking hash"),
//           getStepType("Embedding of chunks"),
//           getStepType("Reconstruction of data"),
//           getStepType("Store chunk hash to Blockchain"),
//           getStepType("Hashing of reconstructive data"),
//           getStepType("Store recombined file to Blockchain")
//         ]);

//         if (stepType1 && stepType2 && stepType3 && stepType4 && stepType5 && stepType6 && stepType7) {
//           const [step1, step2, step3, step4, step5, step6, step7] = await Promise.all([
//             createStep(tenantUserId, "Chunking", "Chunking", stepType1.id, stage4.id, 1),
//             createStep(tenantUserId, "Chunking hash", "Chunking hash", stepType2.id, stage4.id, 2),
//             createStep(tenantUserId, "Embedding of chunks", "Embedding of chunks", stepType3.id, stage4.id, 3),
//             createStep(tenantUserId, "Reconstruction of data", "Reconstruction of data", stepType4.id, stage4.id, 4),
//             createStep(tenantUserId, "Store chunk hash to Blockchain", "Store chunk hash to Blockchain", stepType5.id, stage4.id, 5),
//             createStep(tenantUserId, "Hashing of reconstructive data", "Hashing of reconstructive data", stepType6.id, stage4.id, 6),
//             createStep(
//               tenantUserId,
//               "Store recombined file to Blockchain",
//               "Store recombined file to Blockchain",
//               stepType7.id,
//               stage4.id,
//               7
//             )
//           ]);
//           await addStage5(tenantUserId, projectId);

//         }
    
// }
// }

//  async function addStage5(tenantUserId: string, projectId: string) {
//       // Stage 5: Rag Ingestion
//       const stageType5 = await getStageType("RAG Ingestion");
//       if (stageType5) {
//         const stage5 = await createStage(tenantUserId, "RAG Ingestion", "RAG Ingestion", stageType5.id, projectId, 5);
  
//           const [stepType1] = await Promise.all([getStepType("Writing to open search")]);
//           if (stepType1) {
//             const [step1] = await Promise.all([
//               createStep(tenantUserId, "Writing to open search", "Writing to open search", stepType1.id, stage5.id, 1)
//             ]);
//             await addStage6(tenantUserId, projectId);

//         }
//      }
//  }

//  async function addStage6(tenantUserId: string, projectId: string) {
//     const stageType6 = await getStageType("Published");
//     if (stageType6) {
//       const stage6 = await createStage(tenantUserId, "Published", "Published", stageType6.id, projectId, 6);
//     }
// }

import { createStage, createStep, getStageType, getStepType } from "../db/adminDbFunctions";

// Utility function to create steps
async function createStepsForStage(
  tenantUserId: string,
  stageId: string,
  stepDetails: { name: string; description: string; stepOrder: number }[]
) {
  return Promise.all(
    stepDetails.map(({ name, description, stepOrder }) => 
      getStepType(name).then(stepType => {
        if (stepType) {
          return createStep(tenantUserId, name, description, stepType.id, stageId, stepOrder);
        }
      })
    )
  );
}

// Utility function to create a stage and steps
async function createStageWithSteps(
  tenantUserId: string,
  stageName: string,
  projectId: string,
  stageTypeName: string,
  stepDetails: { name: string; description: string; stepOrder: number }[],
    stageOrder: number
) {
  const stageType = await getStageType(stageTypeName);
  if (stageType) {
    const stage = await createStage(tenantUserId, stageName, stageName, stageType.id, projectId, stageOrder);
    if (stage) {
      await createStepsForStage(tenantUserId, stage.id, stepDetails);
      return stage.id;
    }
  }
  return null;
}

// Utility function to create a stage and steps
async function createStageWithOutSteps(
    tenantUserId: string,
    stageName: string,
    projectId: string,
    stageTypeName: string,
    stepDetails: { name: string; description: string; stepOrder: number }[],
    stageOrder: number
  ) {
    const stageType = await getStageType(stageTypeName);
    if (stageType) {
      const stage = await createStage(tenantUserId, stageName, stageName, stageType.id, projectId, stageOrder);
      if (stage) {
        return stage.id;
      }
    }
    return null;
  }

// Main function to add all stages
export async function addStagesStructure(tenantUserId: string, projectId: string) {
  const stage1Details = [
    { name: "File upload from frontend", description: "File upload from frontend", stepOrder: 1 },
    { name: "File hashing", description: "File hashing", stepOrder: 2 },
    { name: "Store to Blockchain", description: "Store to Blockchain", stepOrder: 3 },
  ];
  const stage2Details = [{ name: "Upload to S3", description: "Upload to S3", stepOrder: 1 }];
  const stage3Details = [
    { name: "Read file from s3", description: "Read file from s3", stepOrder: 1 },
    { name: "Hashing of s3 file", description: "Hashing of s3 file", stepOrder: 2 },
    { name: "Store to Blockchain", description: "Store to Blockchain", stepOrder: 3 },
  ];
  const stage4Details = [
    { name: "Chunking", description: "Chunking", stepOrder: 1 },
    { name: "Chunking hash", description: "Chunking hash", stepOrder: 2 },
    { name: "Embedding of chunks", description: "Embedding of chunks", stepOrder: 3 },
    { name: "Reconstruction of data", description: "Reconstruction of data", stepOrder: 4 },
    { name: "Store chunk hash to Blockchain", description: "Store chunk hash to Blockchain", stepOrder: 5 },
    { name: "Hashing of reconstructive data", description: "Hashing of reconstructive data", stepOrder: 6 },
    { name: "Store recombined file to Blockchain", description: "Store recombined file to Blockchain", stepOrder: 7 },
  ];
  const stage5Details = [{ name: "Writing to open search", description: "Writing to open search", stepOrder: 1 }];
  const stage6Details =[ { name: "Published", description: "Published", stepOrder: 1 }]; // Empty array

  // Create each stage and its steps
  const stage1Id = await createStageWithSteps(tenantUserId, "Data Source", projectId, "Data Source", stage1Details,1);
  if (stage1Id) {
    const stage2Id = await createStageWithSteps(tenantUserId, "Data Ingestion", projectId, "Data Ingestion", stage2Details,2);
    if (stage2Id) {
      const stage3Id = await createStageWithSteps(tenantUserId, "Data Storage", projectId, "Data Storage", stage3Details,3);
      if (stage3Id) {
        const stage4Id = await createStageWithSteps(tenantUserId, "Data Preparation", projectId, "Data Preparation", stage4Details,4);
        if (stage4Id) {
          const stage5Id = await createStageWithSteps(tenantUserId, "RAG Ingestion", projectId, "RAG Ingestion", stage5Details,5);
          if (stage5Id) {
            await createStageWithOutSteps(tenantUserId, "Published", projectId, "Published", stage6Details,6);
          }
        }
      }
    }
  }
}


