import { PendingRequestsOnReconnectingError } from "web3";

export interface customer {
  id?: string;
  tenantuserid: string;
  tenantid?: string;
  emailid: string;
  name: string;
  cubistuserid?: string;
  isactive: boolean;
  isBonusCredit: boolean;
  createdat: string;
  updatedat?: string;
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
  updatedat?: string;
}

export interface tenant {
  id: string;
  customerid?: string;
  adminuserid?: string;
  usertype?: string;
  name: string;
  apikey: string;
  logo: string;
  isactive: boolean;
  iscognitoactive: boolean;
  iscubistactive: any;
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
  tenantid:string;
}

export interface productcategory {
  name: string;
  tenantid: string;
}

export interface updateproductattribute {
  productId: string;
  key: string;
  newValue: string;
}
export interface productattribute {
  key: string;
  value: string;
  type: string;
  productid: string;
}

export interface productfilter {
  key: string;
  operator: "gt" | "lt" | "gte" | "lte" | "eq";
  value: number | string;
}

export interface orders {
  id?: string;
  sellerid?: string;
  buyerid?: string;
  productid?: string;
  price?: number;
  quantity?: number;
  status?: orderstatus;
}

export interface productwishlist {
  id?: string;
  customerid: string;
  productid: string;
  createdat: string;
}

export interface productreview {
  id?: string;
  customerid: string;
  productid?: string;
  orderid?: string;
  comment: string;
  rating: number;
}

export interface createcollection {
  id?: string;
  customerid?: string;
  title?: string;
  description?: string;
}

export interface addtocollection {
  collectionid: string;
  customerid: string;
  productid: string;
}

export interface ProductOwnership {
  id?: string;
  customerId?: string;
  productId?: string;
  fractional?: boolean;
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

export enum productRarity {
  NORMAL = "NORMAL",
  RARE = "RARE",
  EPIC = "EPIC",
  LEGENDARY = "LEGENDARY",
  MYTHICAL = "MYTHICAL"
}

export enum orderstatus {
  CREATED = "CREATED",
  CONFIRMED = "CONFIRMED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
  DISPUTED = "DISPUTED"
}
export enum AvalancheTransactionStatus {
  SUCCESS = 1,
  FAILED = 2,
  PENDING = 0
}

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE"
}

export enum RefType{
  DOCUMENT = "DOCUMENT",
  WEBSITE = "WEBSITE"
}

export enum ProductFindBy {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
  TENANT = 'TENANT'
}

export enum ReviewsFindBy {
  PRODUCT = 'PRODUCT',
  CUSTOMER = 'CUSTOMER'
}

export enum CategoryFindBy {
  CATEGORY = 'CATEGORY',
  TENANT = 'TENANT'
}

export enum CollectionFindBy {
  COLLECTION = 'COLLECTION',
  CUSTOMER = 'CUSTOMER'
}

export enum OrderFindBy {
  ORDER = "ORDER",
  TENANT = "TENANT",
  BUYER = "BUYER",
  SELLER = "SELLER",
  PRODUCT = "PRODUCT"
}