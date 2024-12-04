import { IndexS3Creation } from "../knowledgebase/indexS3Creation";



export const handler = async (event: any, context: any) => {


    let pid = event.projectId;
    let projectName = event.projectName;
    let bucketName = event.bucketName;
    let indexName = event.indexName;
    let indexS3CreationInstance = new IndexS3Creation(projectName, pid)
    const data = await indexS3CreationInstance.validateS3BucketName(bucketName);
    // create s3 bucket
    let bucketCreationResponse = await indexS3CreationInstance.createS3Bucket(bucketName);
    console.log(bucketCreationResponse);
    let indexCreationResponse = await indexS3CreationInstance.createOpenSearchIndex(indexName);
    console.log(indexCreationResponse);
    const kbCreationResponse = await indexS3CreationInstance.createKnowledgeBase(projectName);
    console.log(kbCreationResponse);
    console.log(data);
    return data;
}