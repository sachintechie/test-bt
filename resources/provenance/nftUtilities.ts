import {fetch} from 'fetch';


/**
 * Interface for Scope Specifcation request
 */
interface ScopeSpecificationRequest {
    description: string | null;
    icon_url: string | null;
    name: string; // required
    owner_addresses: string[]; // required
    parties_involved: string[]; // required
    uuid: string | null;
    website_url: string | null;
}

interface ScopeSpecificationResponse {
    tx_hash: string;
    height: number;
    uuid: string;
}


/**
 * Interface for Scope (NFT) minting request
 */

interface Party {
    address: string;
    role: string;
}

interface Scope {
    data_access: string[];
    value_owner_address: string;
    usd_mills: number;
}
interface ScopeMintRequest {
    party: Party;
    scope: Scope;
    records: Object;
    uuid: string;
}

interface ScopeMintResponse {
    tx_hash: string;
    height: number;
    uuid: string;
    scope_uuid: string;
}


export class NFTUtilities {

    /**
     * Provenance labs API endpoint
     */
    private readonly apiEndpoint: string;


    /**
     * Create a new NFT utilities object.
     * @param {string} apiEndpoint - The API endpoint to use.
     */

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint;
    }

    /**
     * Create a Scope Specification Which will have all the details of the type of NFTs that we want to mint.
     */
    async createScopeSpecification(

        request: ScopeSpecificationRequest

    ): Promise<ScopeSpecificationResponse> {

        const response = await fetch(`${this.apiEndpoint}/metadata/scope-specification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`Failed to create scope specification: ${response.statusText}`);
        }

        const data = await response.json();
        
        return data

    }

    /**
     * Create a scope (NFT) for the user based on the given scope specification.
     *
     */
    async mintScope(
            scope_specification_uuid: string,
            request: ScopeMintRequest
    
        ): Promise<ScopeMintResponse> {
    
            const response = await fetch(`${this.apiEndpoint}/metadata/scope-specification/${scope_specification_uuid}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
    
            if (!response.ok) {
                throw new Error(`Failed to mint scope: ${response.statusText}`);
            }
    
            const data = await response.json();
            return data
    
        }
    )


}