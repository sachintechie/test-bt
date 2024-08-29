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
  usertype?: string;
  partialtoken?: string;
  iss?: string;
}

export interface updatecustomer {
  id?: string;
  partialtoken?: string;
  cubistuserid?: string;
  iss?: string;
  emailid?: string;
}

export interface tenant {
  id: string;
  name: string;
  apikey: string;
  logo: string;
  isactive: boolean;
  createdat: string;
  userpoolid: string;
  cognitoclientid: string;
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

export interface product {
  name: string;
  categoryId: string;
  rarity: string;
  price: number;
  ownershipId: string;
}

export interface category {
  name: string;
  tenantId: string;
}

export interface ProductAttributes {
  id: string;
  key: string;
  value: string;
  type: string;
  productId: string;
}

export interface ownership {
  id: string;
  customerId: string;
  productId: string;
  fractional: boolean;
  fraction?: number;
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
  MERGED = "MERGED",
  DEACTIVATED = "DEACTIVATED"
}

export enum StakeType {
  STAKE = "STAKE",
  UNSTAKE = "UNSTAKE"
}

export enum AuthType {
  OTP = "OTP",
  OIDC = "OIDC"
}
