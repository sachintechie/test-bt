import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

export const handler = async (event: any, context: any) => {
    let documents: any[];

    // Check if event is a list, if so, treat it as the documents list directly.
    if (Array.isArray(event)) {
        documents = event;
    } else {
        documents = event?.all_embeddings_with_metadata || [];
    }

    const indexName = process.env.INDEX_NAME || 'sagemaker-index-1';

    console.log(`Handler triggered. Using index: ${indexName}. Processing ${documents.length} documents.`);

    // Connect to OpenSearch
    const client = await connectToOpenSearch();

    console.log("Connecting to OpenSearch...");
    const filenamesList = await indexDocuments(client, indexName, documents);
    console.log(`Indexing completed. Files indexed: ${filenamesList.length}`);

    return {
        statusCode: 200,
        body: JSON.stringify(filenamesList),
    };
};

// Function to connect to OpenSearch
async function connectToOpenSearch() {
    try {
        console.log("Initializing OpenSearch client...");
        const client = new Client({
            ...AwsSigv4Signer({
                region: 'us-east-1',
                service: 'aoss',
                getCredentials: () => {
                    const credentialProvider = defaultProvider();
                    return credentialProvider();
                },
            }),
            node: "https://gkl444a9g3cghs48thd8.us-east-1.aoss.amazonaws.com", // Use your OpenSearch endpoint
        });

        console.log("Successfully connected to OpenSearch.");
        return client;
    } catch (error) {
        console.error("Error connecting to OpenSearch:", error);
        throw new Error('Failed to connect to OpenSearch');
    }
}

// Function to index documents in OpenSearch
async function indexDocuments(client: Client, indexName: string, documents: any[]) {
    const filenames: string[] = [];

    console.log(`Starting indexing of ${documents.length} documents...`);

    for (const doc of documents) {
        console.log(`Indexing document: ${doc.file_name}`);
        const chunkIndexValue = {
            id: '',  // You can choose a suitable ID generation method, e.g., UUID
            embedding: doc.embedding,
            "x-amz-bedrock-kb-source-uri": JSON.stringify({
                file_name: doc.file_name,
                project_id: doc.project_id,
            }),
            metadata: JSON.stringify({ chunk_index: doc.chunk_index }),
            "x-amz-bedrock-kb-data-source-id": "",  // If you have a data source ID, you can fill it here
            chunk_content: doc.chunk_content,
        };

        try {
            // Index the document
            const response = await client.index({
                // id: doc.file_name,  // Assuming file_name is a unique identifier
                 index: indexName,
                 body: chunkIndexValue,
             });
            filenames.push(doc.file_name);

            if (response.body.result === 'created') {
                console.log(`Document indexed successfully: ${doc.file_name}`);
            } else {
                console.log(`Failed to index document: ${doc.file_name}. Response: ${JSON.stringify(response.body)}`);
            }
        } catch (error) {
            console.error(`Error indexing document: ${doc.file_name}. Error: ${error.message}`);
        }
    }

    console.log("Indexing completed.");
    return Array.from(new Set(filenames));  // Return unique file names
}
