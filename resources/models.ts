export interface customer {
  id?: number;
  tenantuserid: string;
  tenantid?: number;
  emailid: string;
  name: string;
  cubistuserid: string;
  isactive: boolean;
  createdat: string;
}

export interface tenant {
  id: number;
  name: string;
  api_key: string;
  logo: string;
  isactive: boolean;
  createdat: string;
}

export interface wallet {
  id?: number;
  customerid: number;
  walletaddress: string;
  symbol: string;
  walletid: string;
  chaintype: string;
  wallettype: string;
  isactive: boolean;
  createdat: string;
  balance?: number;
  decimalprecision?: number;
  contractaddress?: string;

}

export interface token {
  id?: number;
  name: string;
  symbol: string;
  chaintype: string;
  contractaddress: string;
  isactive: boolean;
  createdat: string;
  decimalprecision: number;
}
