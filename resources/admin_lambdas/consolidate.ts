import { IndexS3Creation } from "../knowledgebase/indexS3Creation";



export const handler = async (event: any, context: any) => {


    let pid = event.projectId;
    let projectName = event.projectName;

    let indexS3CreationInstance = new IndexS3Creation(projectName, pid)
    const data = await indexS3CreationInstance.validateS3BucketName('buketname');
    // create s3 bucket
    let bucketName = 'bucketname';
    let bucketCreationResponse = await indexS3CreationInstance.createS3Bucket(bucketName);
    console.log(bucketCreationResponse);
    let indexCreationResponse = await indexS3CreationInstance.createOpenSearchIndex("index-name");
    console.log(indexCreationResponse);
    const kbCreationResponse = await indexS3CreationInstance.createKnowledgeBase(projectName);
    console.log(kbCreationResponse);
    console.log(data);
    return data;
}