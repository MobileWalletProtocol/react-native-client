import { KeyManager } from './components/key/KeyManager';
import {
  decryptContent,
  encryptContent,
  exportKeyToHexString,
  importKeyFromHexString,
} from ':core/cipher/cipher';
import { standardErrors } from ':core/error';
import { RPCRequestMessage, RPCResponse, RPCResponseMessage } from ':core/message';
import { AppMetadata, RequestArguments } from ':core/provider/interface';
import { ScopedAsyncStorage } from ':core/storage/ScopedAsyncStorage';
import { AddressString } from ':core/type';
import { ensureIntNumber, hexStringFromNumber } from ':core/type/util';

const ACCOUNTS_KEY = 'accounts';
const ACTIVE_CHAIN_STORAGE_KEY = 'activeChain';
const AVAILABLE_CHAINS_STORAGE_KEY = 'availableChains';
const WALLET_CAPABILITIES_STORAGE_KEY = 'walletCapabilities';
import { postRequestToWallet } from './components/communication/postRequestToWallet';
import { LIB_VERSION } from './version';
import {
  appendMWPResponsePath,
  checkErrorForInvalidRequestArgs,
  fetchRPCRequest,
} from ':core/util/utils';
import { Wallet } from ':core/wallet';

type Chain = {
  id: number;
  rpcUrl?: string;
};

type MWPClientOptions = {
  metadata: AppMetadata;
  wallet: Wallet;
};

export class MWPClient {
  private readonly metadata: AppMetadata;
  private readonly wallet: Wallet;
  private readonly keyManager: KeyManager;
  private readonly storage: ScopedAsyncStorage;

  private accounts: AddressString[];
  private chain: Chain;

  private constructor({ metadata, wallet }: MWPClientOptions) {
    this.metadata = {
      ...metadata,
      name: metadata.name || 'Dapp',
      customScheme: appendMWPResponsePath(metadata.customScheme),
    };

    this.wallet = wallet;
    this.keyManager = new KeyManager({ wallet: this.wallet });
    this.storage = new ScopedAsyncStorage(this.wallet.name, 'MWPClient');

    // default values
    this.accounts = [];
    this.chain = {
      id: metadata.chainIds?.[0] ?? 1,
    };

    this.handshake = this.handshake.bind(this);
    this.request = this.request.bind(this);
    this.reset = this.reset.bind(this);
  }

  private async initialize() {
    const storedAccounts = await this.storage.loadObject<AddressString[]>(ACCOUNTS_KEY);
    if (storedAccounts) {
      this.accounts = storedAccounts;
    }

    const storedChain = await this.storage.loadObject<Chain>(ACTIVE_CHAIN_STORAGE_KEY);
    if (storedChain) {
      this.chain = storedChain;
    }
  }

  static async createInstance(params: MWPClientOptions) {
    const instance = new MWPClient(params);
    await instance.initialize();
    return instance;
  }

  async handshake(): Promise<AddressString[]> {
    if (this.accounts.length > 0) return this.accounts;

    const handshakeMessage = await this.createRequestMessage({
      handshake: {
        method: 'eth_requestAccounts',
        params: {
          appName: this.metadata.name,
          appLogoUrl: this.metadata.logoUrl,
        },
      },
    });
    const response: RPCResponseMessage = await postRequestToWallet(
      handshakeMessage,
      this.metadata.customScheme,
      this.wallet
    );

    // store peer's public key
    if ('failure' in response.content) throw response.content.failure;
    const peerPublicKey = await importKeyFromHexString('public', response.sender);
    await this.keyManager.setPeerPublicKey(peerPublicKey);

    const decrypted = await this.decryptResponseMessage(response);

    const result = decrypted.result;
    if ('error' in result) throw result.error;

    const accounts = result.value as AddressString[];
    this.accounts = accounts;
    await this.storage.storeObject(ACCOUNTS_KEY, accounts);

    return accounts;
  }

  async request(request: RequestArguments) {
    if (this.accounts.length === 0) {
      throw standardErrors.provider.unauthorized();
    }

    checkErrorForInvalidRequestArgs(request);

    switch (request.method) {
      case 'eth_requestAccounts':
        return this.accounts;
      case 'eth_accounts':
        return this.accounts;
      case 'eth_coinbase':
        return this.accounts[0];
      case 'net_version':
        return this.chain.id;
      case 'eth_chainId':
        return hexStringFromNumber(this.chain.id);
      case 'wallet_getCapabilities':
        return this.storage.loadObject(WALLET_CAPABILITIES_STORAGE_KEY);
      case 'wallet_switchEthereumChain':
        return this.handleSwitchChainRequest(request);
      case 'eth_ecRecover':
      case 'personal_sign':
      case 'personal_ecRecover':
      case 'eth_signTransaction':
      case 'eth_sendTransaction':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
      case 'eth_signTypedData':
      case 'wallet_addEthereumChain':
      case 'wallet_watchAsset':
      case 'wallet_sendCalls':
      case 'wallet_showCallsStatus':
      case 'wallet_grantPermissions':
        return this.sendRequestToPopup(request);
      default:
        if (!this.chain.rpcUrl) throw standardErrors.rpc.internal('No RPC URL set for chain');
        return fetchRPCRequest(request, this.chain.rpcUrl);
    }
  }

  private async sendRequestToPopup(request: RequestArguments) {
    const response = await this.sendEncryptedRequest(request);
    const decrypted = await this.decryptResponseMessage(response);

    const result = decrypted.result;
    if ('error' in result) throw result.error;

    return result.value;
  }

  async reset() {
    await this.storage.clear();
    await this.keyManager.clear();
    this.accounts = [];
    this.chain = {
      id: this.metadata.chainIds?.[0] ?? 1,
    };
  }

  /**
   * @returns `null` if the request was successful.
   * https://eips.ethereum.org/EIPS/eip-3326#wallet_switchethereumchain
   */
  private async handleSwitchChainRequest(request: RequestArguments) {
    const params = request.params as [
      {
        chainId: `0x${string}`;
      },
    ];
    if (!params || !params[0]?.chainId) {
      throw standardErrors.rpc.invalidParams();
    }
    const chainId = ensureIntNumber(params[0].chainId);

    const localResult = await this.updateChain(chainId);
    if (localResult) return null;

    const popupResult = await this.sendRequestToPopup(request);
    if (popupResult === null) {
      this.updateChain(chainId);
    }
    return popupResult;
  }

  private async sendEncryptedRequest(request: RequestArguments): Promise<RPCResponseMessage> {
    const sharedSecret = await this.keyManager.getSharedSecret();
    if (!sharedSecret) {
      throw standardErrors.provider.unauthorized(
        'No valid session found, try requestAccounts before other methods'
      );
    }

    const encrypted = await encryptContent(
      {
        action: request,
        chainId: this.chain.id,
      },
      sharedSecret
    );
    const message = await this.createRequestMessage({ encrypted });

    return postRequestToWallet(message, this.metadata.customScheme, this.wallet);
  }

  private async createRequestMessage(
    content: RPCRequestMessage['content']
  ): Promise<RPCRequestMessage> {
    const publicKey = await exportKeyToHexString('public', await this.keyManager.getOwnPublicKey());
    return {
      id: crypto.randomUUID(),
      sender: publicKey,
      content,
      sdkVersion: LIB_VERSION,
      timestamp: new Date(),
      callbackUrl: this.metadata.customScheme,
    };
  }

  private async decryptResponseMessage(message: RPCResponseMessage): Promise<RPCResponse> {
    const content = message.content;

    // throw protocol level error
    if ('failure' in content) {
      throw content.failure;
    }

    const sharedSecret = await this.keyManager.getSharedSecret();
    if (!sharedSecret) {
      throw standardErrors.provider.unauthorized('Invalid session');
    }

    const response: RPCResponse = await decryptContent(content.encrypted, sharedSecret);

    const availableChains = response.data?.chains;
    if (availableChains) {
      const chains = Object.entries(availableChains).map(([id, rpcUrl]) => ({
        id: Number(id),
        rpcUrl,
      }));
      await this.storage.storeObject(AVAILABLE_CHAINS_STORAGE_KEY, chains);
      await this.updateChain(this.chain.id, chains);
    }

    const walletCapabilities = response.data?.capabilities;
    if (walletCapabilities) {
      await this.storage.storeObject(WALLET_CAPABILITIES_STORAGE_KEY, walletCapabilities);
    }

    return response;
  }

  private async updateChain(chainId: number, newAvailableChains?: Chain[]): Promise<boolean> {
    const chains =
      newAvailableChains ?? (await this.storage.loadObject<Chain[]>(AVAILABLE_CHAINS_STORAGE_KEY));
    const chain = chains?.find((chain) => chain.id === chainId);
    if (!chain) return false;

    if (chain !== this.chain) {
      this.chain = chain;
      await this.storage.storeObject(ACTIVE_CHAIN_STORAGE_KEY, chain);
    }
    return true;
  }
}
