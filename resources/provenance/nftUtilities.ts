import axios from "axios";

/**
 * Interface for Scope Specifcation request
 */
export interface ScopeSpecificationRequest {
  description: string | null;
  icon_url: string | null;
  name: string; // required
  owner_addresses: string[]; // required
  parties_involved: string[]; // required
  uuid: string | null;
  website_url: string | null;
}

export interface ScopeSpecificationResponse {
  tx_hash: string;
  height: number;
  uuid: string;
}

/**
 * Interface for Scope (NFT) minting request
 */

export interface Party {
  address: string;
  role: string;
}

/**
 * Represents the scope of an NFT utility.
 *
 * @interface Scope
 * @property {string[]} data_access - An array of strings representing the data access permissions.
 * @property {string} value_owner_address - The address of the value owner.
 * @property {number} usd_mills - The value in USD mills.
 */
export interface Scope {
  data_access: string[];
  value_owner_address: string;
  usd_mills: number;
}
/**
 * Represents a request to mint a new scope.
 *
 * @interface ScopeMintRequest
 * @property {Party} party - The party involved in the minting request.
 * @property {Scope} scope - The scope of the minting request.
 * @property {Object} records - The records associated with the minting request.
 * @property {string} uuid - The unique identifier for the minting request.
 */
export interface ScopeMintRequest {
  party: Party;
  scope: Scope;
  records: Object;
  uuid: string;
}

/**
 * Interface representing the response from a Scope Mint operation.
 */
export interface ScopeMintResponse {
  /**
   * The transaction hash of the mint operation.
   */
  tx_hash: string;

  /**
   * The block height at which the transaction was included.
   */
  height: number;

  /**
   * The unique identifier for the mint operation.
   */
  uuid: string;

  /**
   * The unique identifier for the scope associated with the mint operation.
   */
  scope_uuid: string;
}

export class NFTUtilities {
  /**
   * Provenance labs API endpoint
   */
  private readonly apiEndpoint: string;
  private readonly apiKey: string;

  /**
   * Create a new NFT utilities object.
   * @param {string} apiEndpoint - The API endpoint to use.
   * @param {string} apiKey - The API key to use.
   */

  constructor(apiEndpoint: string, apiKey: string) {
    this.apiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  /**
   * Create a Scope Specification Which will have all the details of the type of NFTs that we want to mint.
   */
  async createScopeSpecification(request: ScopeSpecificationRequest): Promise<ScopeSpecificationResponse> {
    const response = await fetch(`${this.apiEndpoint}/vault/metadata/scope-specification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiKey: this.apiKey
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to create scope specification: ${response.statusText}`);
    }

    const data = await response.json();

    return data;
  }

  /**
   * Create a scope (NFT) for the user based on the given scope specification.
   *
   */
  async mintScope(scope_specification_uuid: string, request: ScopeMintRequest): Promise<ScopeMintResponse> {
    console.log("mintScope", scope_specification_uuid, request);
    const response = await axios.post(
        `${this.apiEndpoint}/vault/metadata/scope-specification/${scope_specification_uuid}/session`,
        request,
        {
            headers: {
                "Content-Type": "application/json",
                apiKey: this.apiKey
            }
        }
    );
    if (response.status === 200) {
      throw new Error(`Failed to mint scope: ${response.statusText}`);
    }
    console.log(response.data);
    const data = await response.data;
    return data;
  }
}
