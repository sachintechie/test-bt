import AWS from 'aws-sdk';
import { APIGatewayEvent, Context, Callback } from 'aws-lambda';

const s3 = new AWS.S3();
const bedrockAgentClient = new AWS.BedrockAgent({ region: 'us-west-2' });

interface RequestPayload {
    action: string;
    bucket_name: string;
    keys?: string;
    files?: File[];
}

interface File {
    fileName: string;
    fileContent: string;
    contentType: string;
}

export const lambdaHandler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const requestPayload: RequestPayload = JSON.parse(event.body || '{}');
    
    const { action, bucket_name } = requestPayload;
    
    try {
        if (action === 'fetch') {
            if (!bucket_name) throw new Error('Missing parameters for fetch action.');
            
            const response = await s3.listObjectsV2({ Bucket: bucket_name }).promise();
            const sortedContents = response.Contents?.sort((a, b) => b.LastModified!.getTime() - a.LastModified!.getTime()) || [];
            const modifiedObjects = sortedContents.map(modifyObj);

            return {
                statusCode: 200,
                body: JSON.stringify(modifiedObjects, null, 4)
            };
        }

        if (action === 'delete') {
            const keys = requestPayload.keys?.split(',');
            if (!bucket_name || !keys || keys.length < 1) throw new Error('Missing parameters for delete action.');

            for (const key of keys) {
                await s3.deleteObject({ Bucket: bucket_name, Key: key }).promise();
            }
            
            const syncResponse = await syncKb('RBARTCJ5OX', 'DVOK9RY4YF');
            const synced = syncResponse === 'COMPLETE' ? 'Yes' : 'No';

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Objects deleted', synced })
            };
        }

        if (action === 'upload') {
            const files = requestPayload.files || [];
            const uploadedFiles: string[] = [];

            for (const file of files) {
                const fileContent = Buffer.from(file.fileContent, 'base64');
                const uniqueFileName = `${file.fileName}`;

                await s3.putObject({
                    Bucket: bucket_name,
                    Key: uniqueFileName,
                    Body: fileContent,
                    ContentType: file.contentType
                }).promise();

                uploadedFiles.push(uniqueFileName);
            }

            const syncResponse = await syncKb('RBARTCJ5OX', 'DVOK9RY4YF');
            const synced = syncResponse === 'COMPLETE' ? 'Yes' : 'No';

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Files uploaded successfully!',
                    uploadedFiles,
                    synced
                })
            };
        }

        throw new Error('Invalid action.');

    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: error })
        };
    }
};

// Sync knowledge base
const syncKb = async (kbId: string, dataSourceId: string): Promise<string> => {
    const startJobResponse = await bedrockAgentClient.startIngestionJob({
        knowledgeBaseId: kbId,
        dataSourceId
    }).promise();

    const job = startJobResponse.ingestionJob;
    let status = job.status;
    const jobId = job.ingestionJobId;

    while (status !== 'COMPLETE' && status !== 'FAILED') {
        const jobStatus = await bedrockAgentClient.getIngestionJob({
            knowledgeBaseId: kbId,
            dataSourceId,
            ingestionJobId: jobId
        }).promise();

        status = jobStatus.ingestionJob.status;
    }

    return status;
};

const modifyObj = (obj: AWS.S3.Object) => {
    const sizeInBytes = obj.Size!;
    let displaySize: string;

    if (sizeInBytes < 1024) {
        displaySize = `${sizeInBytes} B`;
    } else if (sizeInBytes < 1024 * 1024) {
        displaySize = `${(sizeInBytes / 1024).toFixed(2)} KB`;
    } else {
        displaySize = `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    return {
        ...obj,
        DisplaySize: displaySize // Add the formatted size as a new property
    };
};