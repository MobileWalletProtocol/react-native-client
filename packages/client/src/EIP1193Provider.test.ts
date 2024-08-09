import { standardErrorCodes, standardErrors } from './core/error';
import { EIP1193Provider } from './EIP1193Provider';
import { MWPClient } from './MWPClient';
import { RequestArguments } from ':core/provider/interface';
import { AddressString } from ':core/type';
import { Wallets } from ':core/wallet';

function createProvider() {
  return new EIP1193Provider({
    metadata: {
      appName: 'Test App',
      appLogoUrl: undefined,
      appChainIds: [1],
      appDeeplinkUrl: 'https://example.com',
    },
    wallet: Wallets.CoinbaseSmartWallet,
  });
}

const mockHandshake = jest.fn();
const mockRequest = jest.fn();
const mockReset = jest.fn();

let provider: EIP1193Provider;

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(MWPClient, 'createInstance').mockImplementation(async () => {
    return {
      accounts: [AddressString('0x123')],
      chainId: 1,
      handshake: mockHandshake,
      request: mockRequest,
      reset: mockReset,
    } as unknown as MWPClient;
  });
  provider = createProvider();
});

describe('Event handling', () => {
  it('emits disconnect event on user initiated disconnection', async () => {
    const disconnectListener = jest.fn();
    provider.on('disconnect', disconnectListener);

    await provider.disconnect();

    expect(disconnectListener).toHaveBeenCalledWith(
      standardErrors.provider.disconnected('User initiated disconnection')
    );
  });
});

describe('Request Handling', () => {
  it('returns default chain id even without signer set up', async () => {
    expect(provider.request({ method: 'eth_chainId' })).resolves.toBe('0x1');
    expect(provider.request({ method: 'net_version' })).resolves.toBe(1);
  });

  it('throws error when handling invalid request', async () => {
    await expect(provider.request({} as RequestArguments)).rejects.toThrowEIPError(
      standardErrorCodes.rpc.invalidParams,
      "'args.method' must be a non-empty string."
    );
  });

  it('throws error for requests with unsupported or deprecated method', async () => {
    const deprecated = ['eth_sign', 'eth_signTypedData_v2'];
    const unsupported = ['eth_subscribe', 'eth_unsubscribe'];

    for (const method of [...deprecated, ...unsupported]) {
      await expect(provider.request({ method })).rejects.toThrowEIPError(
        standardErrorCodes.provider.unsupportedMethod
      );
    }
  });
});
