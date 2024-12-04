import { MWPClient } from '../../MWPClient';
import { EIP1193Provider } from './EIP1193Provider';
import { standardErrors } from ':core/error';
import { serializeError } from ':core/error/serialize';
import { Wallet, Wallets } from ':core/wallet';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: jest.fn(),
}));

jest.mock('../../MWPClient');
jest.mock(':core/wallet');

describe('EIP1193Provider', () => {
  let provider: EIP1193Provider;
  let mockWallet: jest.Mocked<Wallet>;
  let mockClient: jest.Mocked<MWPClient>;

  beforeEach(() => {
    mockWallet = Wallets.CoinbaseSmartWallet;
    mockClient = {
      handshake: jest.fn(),
      request: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<MWPClient>;
    (MWPClient.createInstance as jest.Mock).mockResolvedValue(mockClient);

    provider = new EIP1193Provider({
      metadata: { name: 'Test App', customScheme: 'test://deeplink' },
      wallet: mockWallet,
    });
    console.warn = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('constructor initializes correctly', () => {
    expect(provider).toBeDefined();
  });

  test('request method calls client.request', async () => {
    const args = { method: 'eth_getBalance', params: ['0x123'] };
    await provider.request(args);
    expect(mockClient.request).toHaveBeenCalledWith(args);
  });

  test('request method handles errors', async () => {
    const mockError = standardErrors.provider.unauthorized();
    mockClient.request.mockRejectedValue(mockError);
    await expect(provider.request({ method: 'eth_getBalance' })).rejects.toEqual(
      serializeError(mockError)
    );
    expect(mockClient.reset).toHaveBeenCalled();
  });

  test('enable method calls request with eth_requestAccounts', async () => {
    const spy = jest.spyOn(provider, 'request');
    await provider.enable();
    expect(spy).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
  });

  test('disconnect method calls client.reset and emits disconnect event', async () => {
    const spy = jest.spyOn(provider, 'emit');
    await provider.disconnect();
    expect(mockClient.reset).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('disconnect', expect.any(Error));
  });

  test('ensureInitialized waits for initialization', async () => {
    const privateEnsureInitialized = (provider as any).ensureInitialized.bind(provider);
    await expect(privateEnsureInitialized()).resolves.not.toThrow();
  });
});
