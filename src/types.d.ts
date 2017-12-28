import Cacheability, { CacheabilityMetadata } from "cacheability";
import { ClientOpts } from "redis";
import IndexedDBProxy from "./cachemap/proxies/indexed-db";
import LocalStorageProxy from "./cachemap/proxies/local-storage";
import MapProxy from "./cachemap/proxies/map";
import RedisProxy from "./cachemap/proxies/redis";

export interface CacheHeaders {
  cacheControl?: string;
  etag?: string;
  [key: string]: string;
}

export type ClientStoreTypes = "indexedDB" | "localStorage" | "map";

export interface ConstructorArgs {
  disableCacheInvalidation?: boolean;
  indexedDBOptions?: IndexedDBOptions;
  maxHeapSize?: { client?: number, server?: number };
  mockRedis?: boolean;
  name: string;
  reaperOptions?: ReaperOptions;
  redisOptions?: ClientOpts;
  use: { client?: ClientStoreTypes, server?: ServerStoreTypes };
  sortComparator?(a: any, b: any): number;
}

export interface IndexedDBOptions {
  databaseName?: string;
  objectStoreName?: string;
}

export interface Metadata {
  accessedCount: number;
  added: number;
  cacheability: Cacheability;
  key: string;
  lastAccessed: number;
  lastUpdated: number;
  size: number;
}

export interface ObjectMap {
  [key: string]: any;
}

export interface PostMessageArgs {
  args?: ConstructorArgs;
  key?: string;
  opts?: { cacheHeaders?: CacheHeaders, deleteExpired?: boolean, hash?: boolean };
  type: string;
  value?: any;
}

export interface PostMessageResult {
  metadata: Metadata[];
  result?: any;
  usedHeapSize: number;
}

export interface ReaperOptions {
  interval?: number;
  start?: boolean;
}

export type ServerStoreTypes = "map" | "redis";
export type StoreProxyTypes = IndexedDBProxy | MapProxy | RedisProxy | LocalStorageProxy;
export type StoreTypes = "indexedDB" | "localStorage" | "map" | "redis";
