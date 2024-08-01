export interface customer {
  id?: string;
  tenantuserid: string;
  tenantid?: string;
  emailid: string;
  name: string;
  cubistuserid: string;
  isactive: boolean;
  isBonusCredit: boolean;
  createdat: string;
  iss?: string;
}

export interface tenant {
  id: string;
  name: string;
  apikey: string;
  logo: string;
  isactive: boolean;
  createdat: string;
}

export interface wallet {
  id?: string;
  customerid?: string;
  walletaddress?: string;
  symbol: string;
  walletid: string;
  chaintype?: string;
  wallettype?: string;
  isactive?: boolean;
  createdat?: string;
  balance?: number;
  decimalprecision?: number;
  contractaddress?: string;
}

export interface token {
  id?: string;
  name: string;
  symbol: string;
  chaintype: string;
  contractaddress: string;
  isactive: boolean;
  createdat: string;
  decimalprecision: number;
}

export enum TransactionStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING"
}

export enum CallbackStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  PENDING = "PENDING"
}

export enum StakeAccountStatus {
  OPEN = "OPEN",
  CLOSED = "CLOSED",
  FAILED = "FAILED",
  MERGED = "MERGED"
}

export enum StakeType {
  STAKE = "STAKE",
  UNSTAKE = "UNSTAKE"
}
