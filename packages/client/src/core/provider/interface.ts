import { EventEmitter } from 'eventemitter3';

export interface RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | object;
}

export interface ProviderRpcError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

interface ProviderConnectInfo {
  readonly chainId: string;
}

type ProviderEventMap = {
  connect: ProviderConnectInfo;
  disconnect: ProviderRpcError;
  chainChanged: string; // hex string
  accountsChanged: string[];
};

export class ProviderEventEmitter extends EventEmitter<keyof ProviderEventMap> {}

export interface ProviderInterface extends ProviderEventEmitter {
  request(args: RequestArguments): Promise<unknown>;
  disconnect(): Promise<void>;
  emit<K extends keyof ProviderEventMap>(event: K, ...args: [ProviderEventMap[K]]): boolean;
  on<K extends keyof ProviderEventMap>(event: K, listener: (_: ProviderEventMap[K]) => void): this;
}

export type ProviderEventCallback = ProviderInterface['emit'];

export interface AppMetadata {
  /**
   * @param name
   * @type string
   * @description Application name
   */
  name: string;
  /**
   * @param logoUrl
   * @type {string}
   * @description Application logo image URL
   */
  logoUrl?: string;
  /**
   * @param chainIds
   * @type {number[]}
   * @description Array of chainIds in number your dapp supports
   */
  chainIds?: number[];
  /**
   * @param customScheme
   * @type {string}
   * @description Custom URL scheme for returning to this app after wallet interaction
   * @example 'myapp://'
   */
  customScheme: string;
}
