import { ConnectionPreference } from '../../CoinbaseWalletSDK';
import { standardErrorCodes, standardErrors } from '../../core/error';
import { SerializedEthereumRpcError } from '../../core/error/utils';
import { AddressString, Chain } from '../../core/type';
import { ScopedLocalStorage } from '../../lib/ScopedLocalStorage';
import { SCWSigner } from '../../signer/scw/SCWSigner';
import { Signer, SignerUpdateListener } from '../../signer/SignerInterface';
import { WLSigner } from '../../signer/walletlink/WLSigner';
import { ConnectionType } from '../../transport/ConfigMessage';
import { PopUpCommunicator } from '../../transport/PopUpCommunicator';
import { RequestArguments } from '../ProviderInterface';
import { RequestHandler } from './RequestHandler';

interface SignRequestHandlingUpdateListener {
  onAccountsChanged: (accounts: AddressString[]) => void;
  onChainChanged: (chain: Chain) => void;
  onConnect: () => void;
  onResetConnection: () => void;
}

interface SignRequestHandlerOptions {
  storage: ScopedLocalStorage;
  scwUrl?: string;
  appName?: string;
  appLogoUrl?: string | null;
  appChainIds: number[];
  connectionPreference: ConnectionPreference;
  updateListener: SignRequestHandlingUpdateListener;
}

const CONNECTION_TYPE_KEY = 'SignRequestHandler:connectionType';

export class SignRequestHandler implements RequestHandler {
  private appName: string;
  private appLogoUrl: string | null;
  private appChainIds: number[];
  private connectionPreference: ConnectionPreference;

  private connectionType: string | null;
  private connectionTypeSelectionResolver: ((value: unknown) => void) | undefined;
  private signer: Signer | undefined;

  private storage: ScopedLocalStorage;
  private popupCommunicator: PopUpCommunicator;
  private updateListener: SignRequestHandlingUpdateListener;

  constructor(options: Readonly<SignRequestHandlerOptions>) {
    this.storage = options.storage;
    this.popupCommunicator = new PopUpCommunicator({
      url: options.scwUrl || 'https://keys.coinbase.com/connect',
    });
    this.updateListener = options.updateListener;

    // getWalletLinkUrl is called by the PopUpCommunicator when
    // it receives message.type === 'wlQRCodeUrl' from the cb-wallet-scw popup
    // its injected because we don't want to instantiate WalletLinkSigner until we have to
    this.getWalletLinkUrl = this.getWalletLinkUrl.bind(this);
    this.popupCommunicator.setWLQRCodeUrlCallback(this.getWalletLinkUrl);

    this.appName = options.appName ?? '';
    this.appLogoUrl = options.appLogoUrl ?? null;
    this.appChainIds = options.appChainIds;

    const persistedConnectionType = this.storage.getItem(CONNECTION_TYPE_KEY);
    this.connectionType = persistedConnectionType;
    this.connectionPreference = options.connectionPreference;

    if (persistedConnectionType) {
      this.initSigner();
    }

    this.setConnectionType = this.setConnectionType.bind(this);
    this.initWalletLinkSigner = this.initWalletLinkSigner.bind(this);
  }

  private readonly updateRelay: SignerUpdateListener = {
    onAccountsChanged: (_, ...rest) => this.updateListener.onAccountsChanged(...rest),
    onChainChanged: (signer, ...rest) => {
      // if (signer !== this.signer) return; // ignore events from inactive signers
      if (signer instanceof WLSigner) {
        this.connectionTypeSelectionResolver?.('walletlink');
      }
      this.updateListener.onChainChanged(...rest);
    },
  };

  private initSigner = () => {
    if (this.connectionType === 'scw') {
      this.initScwSigner();
    } else if (this.connectionType === 'walletlink') {
      this.initWalletLinkSigner();
    }
  };

  private initScwSigner() {
    if (this.signer instanceof SCWSigner) return;
    this.signer = new SCWSigner({
      appName: this.appName,
      appLogoUrl: this.appLogoUrl,
      appChainIds: this.appChainIds,
      puc: this.popupCommunicator,
      storage: this.storage,
      updateListener: this.updateRelay,
    });
  }

  private initWalletLinkSigner() {
    if (this.signer instanceof WLSigner) return;

    this.signer = new WLSigner({
      appName: this.appName,
      appLogoUrl: this.appLogoUrl,
      storage: this.storage,
      updateListener: this.updateRelay,
    });
  }

  async onDisconnect() {
    this.connectionType = null;
    await this.signer?.disconnect();
  }

  async handleRequest(request: RequestArguments, accounts: AddressString[]) {
    try {
      if (request.method === 'eth_requestAccounts') {
        return await this.eth_requestAccounts(accounts);
      }

      if (!this.signer || accounts.length <= 0) {
        throw standardErrors.provider.unauthorized(
          "Must call 'eth_requestAccounts' before other methods"
        );
      }

      return await this.signer.request(request);
    } catch (err) {
      if ((err as SerializedEthereumRpcError).code === standardErrorCodes.provider.unauthorized) {
        this.updateListener.onResetConnection();
      }
      throw err;
    }
  }

  async eth_requestAccounts(accounts: AddressString[]): Promise<AddressString[]> {
    if (accounts.length > 0) {
      this.updateListener.onConnect();
      return Promise.resolve(accounts);
    }

    if (!this.connectionType) {
      // WL: this promise hangs until the QR code is scanned
      // SCW: this promise hangs until the user signs in with passkey
      const connectionType = await this.completeConnectionTypeSelection();
      this.setConnectionType(connectionType as ConnectionType);
    }

    // in the case of walletlink, this doesn't do anything since signer is initialized
    // when the wallet link QR code url is requested
    this.initSigner();

    const ethAddresses = await this.signer?.handshake();
    if (Array.isArray(ethAddresses)) {
      if (this.connectionType === 'walletlink') {
        this.popupCommunicator.walletLinkQrScanned();
      }
      this.updateListener.onAccountsChanged(ethAddresses);
      this.updateListener.onConnect();
      return Promise.resolve(ethAddresses);
    }
    return Promise.reject(standardErrors.rpc.internal('Failed to get accounts'));
  }

  private getWalletLinkUrl() {
    this.initWalletLinkSigner();
    if (!(this.signer instanceof WLSigner)) {
      throw standardErrors.rpc.internal(
        'Signer not initialized or Signer.getWalletLinkUrl not defined'
      );
    }
    return this.signer.getQRCodeUrl();
  }

  private async completeConnectionTypeSelection() {
    await this.popupCommunicator.connect();

    return new Promise((resolve) => {
      this.connectionTypeSelectionResolver = resolve.bind(this);

      this.popupCommunicator
        .selectConnectionType({
          connectionPreference: this.connectionPreference,
        })
        .then((connectionType) => {
          resolve(connectionType);
        });
    });
  }

  // storage methods
  private setConnectionType(connectionType: string) {
    if (this.connectionType === connectionType) return;
    this.connectionType = connectionType;
    this.storage.setItem(CONNECTION_TYPE_KEY, this.connectionType);
  }

  canHandleRequest(request: RequestArguments): boolean {
    const methodsThatRequireSigning = [
      'eth_requestAccounts',
      'eth_sign',
      'eth_ecRecover',
      'personal_sign',
      'personal_ecRecover',
      'eth_signTransaction',
      'eth_sendTransaction',
      'eth_signTypedData_v1',
      'eth_signTypedData_v2',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
      'eth_signTypedData',
      'wallet_addEthereumChain',
      'wallet_switchEthereumChain',
      'wallet_watchAsset',
    ];

    return methodsThatRequireSigning.includes(request.method);
  }
}
