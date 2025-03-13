import * as WebBrowser from 'expo-web-browser';

import { postRequestToWallet } from './postRequestToWallet.js';
import { decodeResponseURLParams, encodeRequestURLParams } from './utils/encoding.js';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message/index.js';
import { Wallet } from ':core/wallet/index.js';

vi.mock('expo-web-browser', () => ({
  openAuthSessionAsync: vi.fn(),
  dismissBrowser: vi.fn(),
}));

vi.mock('./utils/encoding', () => ({
  decodeResponseURLParams: vi.fn(),
  encodeRequestURLParams: vi.fn(),
}));

const mockAppCustomScheme = 'myapp://';
const mockWalletScheme = 'https://example.com';

describe('postRequestToWallet', () => {
  const mockRequest: RPCRequestMessage = {
    id: '1-2-3-4-5',
    sdkVersion: '1.0.0',
    content: {
      handshake: {
        method: 'eth_requestAccounts',
        params: { appName: 'test' },
      },
    },
    callbackUrl: 'https://example.com',
    sender: 'Sender',
    timestamp: new Date(),
  };
  const mockResponse: RPCResponseMessage = {
    id: '2-2-3-4-5',
    requestId: '1-2-3-4-5',
    content: {
      encrypted: {
        iv: new Uint8Array([1]),
        cipherText: new Uint8Array([2]),
      },
    },
    sender: 'some-sender',
    timestamp: new Date(),
  };
  let requestUrl: URL;

  beforeEach(() => {
    requestUrl = new URL(mockWalletScheme);
    (encodeRequestURLParams as ReturnType<typeof vi.fn>).mockReturnValue('mocked-search-params');
    requestUrl.search = encodeRequestURLParams(mockRequest);
    vi.clearAllMocks();
  });

  it('should successfully post request to a web-based wallet', async () => {
    const webWallet: Wallet = { type: 'web', scheme: mockWalletScheme } as Wallet;
    (WebBrowser.openAuthSessionAsync as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'success',
      url: 'https://example.com/response',
    });
    (decodeResponseURLParams as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

    const result = await postRequestToWallet(mockRequest, mockAppCustomScheme, webWallet);

    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      requestUrl.toString(),
      mockAppCustomScheme,
      {
        preferEphemeralSession: false,
      }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error if the user cancels the request', async () => {
    const webWallet: Wallet = { type: 'web', scheme: mockWalletScheme } as Wallet;
    (WebBrowser.openAuthSessionAsync as ReturnType<typeof vi.fn>).mockResolvedValue({
      type: 'cancel',
    });

    await expect(postRequestToWallet(mockRequest, mockAppCustomScheme, webWallet)).rejects.toThrow(
      'User rejected the request'
    );
  });

  it('should throw an error for native wallet type', async () => {
    const nativeWallet: Wallet = { type: 'native', scheme: mockWalletScheme } as Wallet;

    await expect(
      postRequestToWallet(mockRequest, mockAppCustomScheme, nativeWallet)
    ).rejects.toThrow('Native wallet not supported yet');
  });

  it('should throw an error for unsupported wallet type', async () => {
    const unsupportedWallet: Wallet = {
      type: 'unsupported' as any,
      scheme: mockWalletScheme,
    } as Wallet;

    await expect(
      postRequestToWallet(mockRequest, mockAppCustomScheme, unsupportedWallet)
    ).rejects.toThrow('Unsupported wallet type');
  });

  it('should pass through any errors from WebBrowser', async () => {
    const webWallet: Wallet = { type: 'web', scheme: mockWalletScheme } as Wallet;
    const mockError = new Error('Communication error');
    (WebBrowser.openAuthSessionAsync as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

    await expect(postRequestToWallet(mockRequest, mockAppCustomScheme, webWallet)).rejects.toThrow(
      'User rejected the request'
    );
  });
});
