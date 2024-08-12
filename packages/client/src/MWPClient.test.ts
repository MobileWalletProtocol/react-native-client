import { WebBasedWalletCommunicator } from 'src/components/communicator/webBased/Communicator';

import { KeyManager } from './components/key/KeyManager';
import { MWPClient } from './MWPClient';
import {
  decryptContent,
  encryptContent,
  exportKeyToHexString,
  importKeyFromHexString,
} from ':core/cipher/cipher';
import { CryptoKey } from ':core/cipher/types';
import { standardErrors } from ':core/error';
import { EncryptedData, RPCResponseMessage } from ':core/message';
import { AppMetadata, RequestArguments } from ':core/provider/interface';
import { ScopedAsyncStorage } from ':core/storage/ScopedAsyncStorage';
import { Wallets } from ':core/wallet';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: jest.fn(),
}));

jest.mock('./components/key/KeyManager');
const storageStoreSpy = jest.spyOn(ScopedAsyncStorage.prototype, 'storeObject');
const storageClearSpy = jest.spyOn(ScopedAsyncStorage.prototype, 'clear');

jest.mock(':core/cipher/cipher', () => ({
  decryptContent: jest.fn(),
  encryptContent: jest.fn(),
  exportKeyToHexString: jest.fn(),
  importKeyFromHexString: jest.fn(),
}));

const mockCryptoKey = {} as CryptoKey;
const encryptedData = {} as EncryptedData;
const mockChains = {
  '1': 'https://eth-rpc.example.com/1',
  '2': 'https://eth-rpc.example.com/2',
};
const mockCapabilities = {};

const mockError = standardErrors.provider.unauthorized();
const mockSuccessResponse: RPCResponseMessage = {
  id: '1-2-3-4-5',
  requestId: '1-2-3-4-5',
  sender: '0xPublicKey',
  content: { encrypted: encryptedData },
  timestamp: new Date(),
};

const mockWallet = Wallets.CoinbaseSmartWallet;

describe('MWPClient', () => {
  let signer: MWPClient;
  let mockMetadata: AppMetadata;
  let mockKeyManager: jest.Mocked<KeyManager>;

  beforeEach(async () => {
    mockMetadata = {
      appName: 'test',
      appChainIds: [1],
      appDeeplinkUrl: 'https://example.com',
    };

    jest
      .spyOn(WebBasedWalletCommunicator, 'postRequestAndWaitForResponse')
      .mockResolvedValue(mockSuccessResponse);

    mockKeyManager = new KeyManager({
      wallet: mockWallet,
    }) as jest.Mocked<KeyManager>;
    (KeyManager as jest.Mock).mockImplementation(() => mockKeyManager);
    storageStoreSpy.mockReset();

    (importKeyFromHexString as jest.Mock).mockResolvedValue(mockCryptoKey);
    (exportKeyToHexString as jest.Mock).mockResolvedValueOnce('0xPublicKey');
    mockKeyManager.getSharedSecret.mockResolvedValue(mockCryptoKey);
    (encryptContent as jest.Mock).mockResolvedValueOnce(encryptedData);

    signer = await MWPClient.createInstance({
      metadata: mockMetadata,
      wallet: mockWallet,
    });
  });

  describe('handshake', () => {
    it('should perform a successful handshake', async () => {
      (decryptContent as jest.Mock).mockResolvedValueOnce({
        result: {
          value: ['0xAddress'],
        },
        data: {
          chains: mockChains,
          capabilities: mockCapabilities,
        },
      });

      await signer.handshake();

      expect(importKeyFromHexString).toHaveBeenCalledWith('public', '0xPublicKey');
      expect(mockKeyManager.setPeerPublicKey).toHaveBeenCalledWith(mockCryptoKey);
      expect(decryptContent).toHaveBeenCalledWith(encryptedData, mockCryptoKey);

      expect(storageStoreSpy).toHaveBeenCalledWith('availableChains', [
        { id: 1, rpcUrl: 'https://eth-rpc.example.com/1' },
        { id: 2, rpcUrl: 'https://eth-rpc.example.com/2' },
      ]);
      expect(storageStoreSpy).toHaveBeenCalledWith('walletCapabilities', mockCapabilities);
      expect(storageStoreSpy).toHaveBeenCalledWith('accounts', ['0xAddress']);

      expect(signer.request({ method: 'eth_requestAccounts' })).resolves.toEqual(['0xAddress']);
    });

    it('should throw an error if failure in response.content', async () => {
      const mockResponse: RPCResponseMessage = {
        id: '1-2-3-4-5',
        requestId: '1-2-3-4-5',
        sender: '0xPublicKey',
        content: { failure: mockError },
        timestamp: new Date(),
      };
      (WebBasedWalletCommunicator.postRequestAndWaitForResponse as jest.Mock).mockResolvedValue(
        mockResponse
      );

      await expect(signer.handshake()).rejects.toThrowError(mockError);
    });
  });

  describe('request', () => {
    beforeAll(() => {
      jest.spyOn(ScopedAsyncStorage.prototype, 'loadObject').mockImplementation(async (key) => {
        switch (key) {
          case 'accounts':
            return ['0xAddress'];
          case 'activeChain':
            return { id: 1, rpcUrl: 'https://eth-rpc.example.com/1' };
          default:
            return null;
        }
      });
    });

    afterAll(() => {
      jest.spyOn(ScopedAsyncStorage.prototype, 'loadObject').mockRestore();
    });

    it('should perform a successful request', async () => {
      const mockRequest: RequestArguments = {
        method: 'personal_sign',
        params: ['0xMessage', '0xAddress'],
      };

      (decryptContent as jest.Mock).mockResolvedValueOnce({
        result: {
          value: '0xSignature',
        },
      });

      const result = await signer.request(mockRequest);

      expect(encryptContent).toHaveBeenCalled();
      expect(WebBasedWalletCommunicator.postRequestAndWaitForResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: '0xPublicKey',
          content: { encrypted: encryptedData },
        }),
        mockWallet.scheme
      );
      expect(result).toEqual('0xSignature');
    });

    it('should throw an error if error in decrypted response', async () => {
      const mockRequest: RequestArguments = {
        method: 'personal_sign',
        params: ['0xMessage', '0xAddress'],
      };

      (decryptContent as jest.Mock).mockResolvedValueOnce({
        result: {
          error: mockError,
        },
      });

      await expect(signer.request(mockRequest)).rejects.toThrowError(mockError);
    });

    it('should update internal state for successful wallet_switchEthereumChain', async () => {
      const mockRequest: RequestArguments = {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x1' }],
      };

      (decryptContent as jest.Mock).mockResolvedValueOnce({
        result: {
          value: null,
        },
        data: {
          chains: mockChains,
          capabilities: mockCapabilities,
        },
      });

      await signer.request(mockRequest);

      expect(storageStoreSpy).toHaveBeenCalledWith('availableChains', [
        { id: 1, rpcUrl: 'https://eth-rpc.example.com/1' },
        { id: 2, rpcUrl: 'https://eth-rpc.example.com/2' },
      ]);
      expect(storageStoreSpy).toHaveBeenCalledWith('walletCapabilities', mockCapabilities);
    });
  });

  describe('reset', () => {
    it('should reset successfully', async () => {
      await signer.reset();

      expect(storageClearSpy).toHaveBeenCalled();
      expect(mockKeyManager.clear).toHaveBeenCalled();
      expect(signer['accounts']).toEqual([]);
      expect(signer['chain']).toEqual({ id: 1 });
    });
  });
});
