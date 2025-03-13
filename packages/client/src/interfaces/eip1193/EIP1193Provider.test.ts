import { MWPClient } from '../../MWPClient.js';
import { EIP1193Provider } from './EIP1193Provider.js';
import { standardErrors } from ':core/error/index.js';
import { serializeError } from ':core/error/serialize.js';
import { Wallet, Wallets } from ':core/wallet/index.js';

vi.mock('expo-web-browser', () => ({
  openBrowserAsync: vi.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: vi.fn(),
}));

vi.mock('../../MWPClient');
vi.mock(':core/wallet');

describe('EIP1193Provider', () => {
  let provider: EIP1193Provider;
  let mockWallet: Wallet;
  let mockClient: MWPClient;

  beforeEach(() => {
    mockWallet = Wallets.CoinbaseSmartWallet;
    mockClient = {
      handshake: vi.fn(),
      request: vi.fn(),
      reset: vi.fn(),
    } as unknown as MWPClient;
    (MWPClient.createInstance as ReturnType<typeof vi.fn>).mockResolvedValue(mockClient);

    provider = new EIP1193Provider({
      metadata: { name: 'Test App', customScheme: 'test://deeplink' },
      wallet: mockWallet,
    });
    console.warn = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
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
    (mockClient.request as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);
    await expect(provider.request({ method: 'eth_getBalance' })).rejects.toEqual(
      serializeError(mockError)
    );
    expect(mockClient.reset).toHaveBeenCalled();
  });

  test('enable method calls request with eth_requestAccounts', async () => {
    const spy = vi.spyOn(provider, 'request');
    await provider.enable();
    expect(spy).toHaveBeenCalledWith({ method: 'eth_requestAccounts' });
  });

  test('disconnect method calls client.reset and emits disconnect event', async () => {
    const spy = vi.spyOn(provider, 'emit');
    await provider.disconnect();
    expect(mockClient.reset).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith('disconnect', expect.any(Error));
  });

  test('ensureInitialized waits for initialization', async () => {
    const privateEnsureInitialized = (provider as any).ensureInitialized.bind(provider);
    await expect(privateEnsureInitialized()).resolves.not.toThrow();
  });
});
