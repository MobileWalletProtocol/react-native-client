import { MWPClient } from '../../MWPClient';
import { standardErrorCodes, standardErrors } from ':core/error';
import { serializeError } from ':core/error/serialize';
import {
  AppMetadata,
  ProviderEventEmitter,
  ProviderInterface,
  RequestArguments,
} from ':core/provider/interface';
import { Wallet } from ':core/wallet';

type EIP1193ProviderOptions = {
  metadata: AppMetadata;
  wallet: Wallet;
};

export class EIP1193Provider extends ProviderEventEmitter implements ProviderInterface {
  private initPromise: Promise<void>;
  private client: MWPClient | null = null;

  constructor(options: Readonly<EIP1193ProviderOptions>) {
    super();
    this.initPromise = this.initialize(options);
  }

  private async initialize(options: EIP1193ProviderOptions) {
    this.client = await MWPClient.createInstance(options);
  }

  public async request(args: RequestArguments): Promise<unknown> {
    await this.ensureInitialized();
    try {
      if (!this.client) throw standardErrors.rpc.internal('MWPClient not initialized');

      if (args.method === 'eth_requestAccounts') {
        const accounts = await this.client.handshake();
        return accounts;
      }

      return await this.client.request(args);
    } catch (error) {
      const { code } = error as { code?: number };
      if (code === standardErrorCodes.provider.unauthorized) this.disconnect();
      return Promise.reject(serializeError(error));
    }
  }

  /** @deprecated Use `.request({ method: 'eth_requestAccounts' })` instead. */
  public async enable() {
    console.warn(
      `.enable() has been deprecated. Please use .request({ method: "eth_requestAccounts" }) instead.`
    );
    return await this.request({
      method: 'eth_requestAccounts',
    });
  }

  async disconnect() {
    await this.ensureInitialized();
    await this.client?.reset();
    this.emit('disconnect', standardErrors.provider.disconnected('User initiated disconnection'));
  }

  private async ensureInitialized() {
    await this.initPromise; // resolves immediately if already initialized
  }
}
