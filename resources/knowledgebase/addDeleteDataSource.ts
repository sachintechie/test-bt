import AWS from 'aws-sdk';
import { APIGatewayEvent, Context, Callback } from 'aws-lambda';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { URL } from 'url';

// Initialize DynamoDB resource and Bedrock client
const dynamodb = new AWS.DynamoDB.DocumentClient();
const bedrockClient = new AWS.BedrockAgent();
const knowledgeBaseId = 'RBARTCJ5OX';

// Lambda handler
export const lambdaHandler = async (event: APIGatewayEvent, context: Context, callback: Callback) => {
    const requestPayload = JSON.parse(event.body || '{}');
    
    const { operation } = requestPayload;

    if (operation === 'CREATE') {
        const { url, depth, tableName } = requestPayload;
        const ingested = 'No';
        const table = dynamodbTable(tableName);
        const now = new Date();
        const dtString = now.toLocaleString();

        return createItem(table, url, ingested, depth, dtString);
    } else if (operation === 'DELETE_DS') {
        const { url, tableName } = requestPayload;
        const table = dynamodbTable(tableName);

        return deleteDataSource(table, url);
    } else if (operation === 'SCAN') {
        const { tableName } = requestPayload;
        const table = dynamodbTable(tableName);

        return scanTable(table);
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify('Unsupported method')
        };
    }
};

// Helper function to initialize DynamoDB table
const dynamodbTable = (tableName: string): DocumentClient.TableName => {
    return dynamodb.Table(tableName);
};

// Create item in DynamoDB and initiate data source
const createItem = async (table: DocumentClient, url: string, ingested: string, depth: string, dtString: string) => {
    try {
        const domain = new URL(url).hostname.replace(/\./g, '_');

        const dataSourceResponse = await bedrockClient.createDataSource({
            knowledgeBaseId,
            name: domain,
            description: 'Web DS',
            dataSourceConfiguration: {
                type: 'WEB',
                webConfiguration: {
                    sourceConfiguration: {
                        urlConfiguration: {
                            seedUrls: [{ url }]
                        }
                    },
                    crawlerConfiguration: {
                        crawlerLimits: { rateLimit: 300 },
                        scope: 'HOST_ONLY'
                    }
                }
            }
        }).promise();

        const datasourceId = dataSourceResponse.dataSource.dataSourceId;
        const ingestionResponse = await bedrockClient.startIngestionJob({
            dataSourceId: datasourceId,
            knowledgeBaseId
        }).promise();

        const ingestionJobId = ingestionResponse.ingestionJob.ingestionJobId;

        await table.put({
            TableName: table.TableName,
            Item: {
                url,
                ingested,
                depth,
                'added-at': dtString,
                datasource_id: datasourceId,
                ingestionJobId
            }
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify('Added item and data source.')
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Error creating item: ${error.message}`)
        };
    }
};

// Delete data source
const deleteDataSource = async (table: DocumentClient, url: string) => {
    try {
        const domain = new URL(url).hostname.replace(/\./g, '_');
        const item = await table.get({
            TableName: table.TableName,
            Key: { url }
        }).promise();

        const { datasource_id, ingestionJobId } = item.Item;
        const jobSummaries = await bedrockClient.listIngestionJobs({
            dataSourceId: datasource_id,
            knowledgeBaseId
        }).promise();

        const currentJobId = jobSummaries.ingestionJobSummaries[0].ingestionJobId;

        if (ingestionJobId === currentJobId) {
            const jobStatus = await bedrockClient.getIngestionJob({
                dataSourceId: datasource_id,
                ingestionJobId,
                knowledgeBaseId
            }).promise();

            const status = jobStatus.ingestionJob.status;

            if (status === 'COMPLETE' || status === 'FAILED') {
                await bedrockClient.deleteDataSource({
                    dataSourceId: datasource_id,
                    knowledgeBaseId
                }).promise();

                return {
                    statusCode: 200,
                    body: JSON.stringify('Data source delete initiated.')
                };
            } else {
                return {
                    statusCode: 400,
                    body: JSON.stringify('Delete is not allowed while data source ingestion is in progress.')
                };
            }
        } else {
            await bedrockClient.deleteDataSource({
                dataSourceId: datasource_id,
                knowledgeBaseId
            }).promise();

            return {
                statusCode: 200,
                body: JSON.stringify('Data source delete initiated.')
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Error deleting data source: ${error.message}`)
        };
    }
};

// Scan DynamoDB table
const scanTable = async (table: DocumentClient) => {
    try {
        const dataSources = await bedrockClient.listDataSources({
            knowledgeBaseId
        }).promise();

        const dsIds = dataSources.dataSourceSummaries.map(ds => ds.dataSourceId);
        const items = await table.scan({ TableName: table.TableName }).promise();

        const updatedItems = await Promise.all(items.Items.map(async item => {
            if (dsIds.includes(item.datasource_id)) {
                const dsStatus = await bedrockClient.getDataSource({
                    dataSourceId: item.datasource_id,
                    knowledgeBaseId
                }).promise();

                item.status = dsStatus.dataSource.status;

                const ingestionJobs = await bedrockClient.listIngestionJobs({
                    dataSourceId: item.datasource_id,
                    knowledgeBaseId
                }).promise();

                const ijIds = ingestionJobs.ingestionJobSummaries.map(ij => ij.ingestionJobId);

                if (ijIds.includes(item.ingestionJobId)) {
                    const ingestionStatus = await bedrockClient.getIngestionJob({
                        dataSourceId: item.datasource_id,
                        ingestionJobId: item.ingestionJobId,
                        knowledgeBaseId
                    }).promise();

                    item['ingestion-status'] = ingestionStatus.ingestionJob.status;
                } else {
                    item['ingestion-status'] = 'COMPLETE';
                }

            } else {
                await table.delete({
                    TableName: table.TableName,
                    Key: { url: item.url }
                }).promise();
            }

            return item;
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(updatedItems)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(`Error scanning table: ${error}`)
        };
    }
};
