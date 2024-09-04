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
  categoryid: string;
  rarity: productRarity;
  price: number;
  purchasedpercentage: number;
}

export interface productcategory {
  name: string;
  tenantid: string;
}

export interface productattribute {
  key: string;
  value: string;
  type: string;
  productid: string;
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

export enum productRarity {
  NORMAL = "NORMAL",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
  MYTHICAL = "MYTHICAL"
}
