/**
 * THIS FILE IS USED TO CREATE A NEW SCOPE SPECIFICATION ON PROVENANCE CHAIN FOR SCOPE/NFT MINTING
 */
import {NFTUtilities} from '../provenance/nftUtilities';


const provenance_api_key = process.env.PROVENANCE_API_KEY || "";
const provenance_api_url = process.env.PROVENANCE_API_URL || "";


export const handler = async (event: any, context: any) => {
    try {
        const { resolverContext } = event.identity;
        const { description, icon_url, name, owner_addresses, parties_involved, website_url } = event.arguments?.input;

        const nftUtilities = new NFTUtilities(provenance_api_url, provenance_api_key);

        const data = await nftUtilities.createScopeSpecification({
            description, icon_url, name, owner_addresses, parties_involved, website_url, uuid: null
        });



        return {
            status: data.uuid ? 200 : 400,
            data: data,
            error: null
            
        };
    } catch (err) {
        console.error("Error in handler:", err);
        return { status: 400, data: null, error: err };
    }
}