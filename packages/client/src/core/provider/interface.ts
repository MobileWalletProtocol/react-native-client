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
   * @param appName
   * @type string
   * @description Application name
   */
  appName: string;
  /**
   * @param appLogoUrl
   * @type {string}
   * @description Application logo image URL
   */
  appLogoUrl?: string;
  /**
   * @param appChainIds
   * @type {number[]}
   * @description Array of chainIds in number your dapp supports
   */
  appChainIds?: number[];
  /**
   * @param appCustomScheme
   * @type {string}
   * @description Custom URL scheme for returning to this app after wallet interaction
   * @example 'myapp://'
   */
  appCustomScheme: string;
}
