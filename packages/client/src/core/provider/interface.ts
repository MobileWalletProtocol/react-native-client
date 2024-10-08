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
   * @param appDeeplinkUrl
   * @type string
   * @note HTTPS URL is required for production
   * @description Universal Link url on iOS or App Link url on Android to establish app's identity
   * @example 'https://example.com'
   */
  appDeeplinkUrl: string;
  /**
   * @param appCustomScheme
   * @type {string}
   * @note Optional, but will be required in next minor version
   * @description Custom URL scheme used for establishing less disruptive communication channel with wallet
   * @example 'myapp://'
   */
  appCustomScheme?: string;
}
