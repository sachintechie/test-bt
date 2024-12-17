import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { defaultProvider } from "@aws-sdk/credential-provider-node";

// Function to connect to OpenSearch
export async function connectToOpenSearch() {
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
            node: process.env.OPEN_SEARCH_HOST,
             // Use your OpenSearch endpoint
        });

        console.log("Successfully connected to OpenSearch.");
        return client;
    } catch (error) {
        console.error("Error connecting to OpenSearch:", error);
        throw new Error('Failed to connect to OpenSearch');
    }
}

// Function to index documents in OpenSearch
async function indexDocuments( indexName: string, documents: any[]) {
    const filenames = [];
    const client = await connectToOpenSearch();

    console.log(`Starting indexing of ${documents.length} documents...`);

    for (const doc of documents) {
     //   console.log(`Indexing document: ${doc}`);
     //   console.log(`Indexing document: ${doc.file_name}`);
        const chunkIndexValue = {
             id: '',  // You can choose a suitable ID generation method, e.g., UUID
            embedding: doc.embedding,
            "x-amz-bedrock-kb-source-uri": JSON.stringify({
                file_name: doc.file_name,
                project_id: doc.project_id,
                ref_id: doc.ref_id,
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
                // refresh: true,  // Ensure the index is refreshed after the document is added
            });
          console.log("response", response);

            if (response.body.result === 'created') {
                filenames.push({fileName : doc.file_name ,status : "success"});
               // console.log(`Document indexed successfully: ${doc.file_name}`);
            } else {
                filenames.push({fileName : doc.file_name ,status : "errored"});

                console.log(`Failed to index document: ${doc.file_name}. Response: ${JSON.stringify(response.body)}`);
            }
        } catch (error :any) {
           
            console.error(`Error indexing document: ${doc.file_name}. Error: ${error}`);
        }
    }

    console.log("Indexing completed.",filenames);
    // To return unique filenames based on the `fileName` property
const uniqueFilenames = [
    ...new Map(filenames.map(item => [item.fileName, item])).values()
];

    return uniqueFilenames  // Return unique file names
}


export async function addToOpenSearch( documents: any[],indexName: string) {

   // const index = process.env.OPENSEARCH_INDEX_NAME || 'sagemaker-index-1';
    const index = indexName;



    const response = await indexDocuments( index, documents);
    console.log("response", response);
    return response;
}