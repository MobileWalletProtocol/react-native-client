import * as WebBrowser from 'expo-web-browser';

import { postRequestToWallet } from './postRequestToWallet';
import { decodeResponseURLParams, encodeRequestURLParams } from './utils/encoding';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message';
import { Wallet } from ':core/wallet';

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
  dismissBrowser: jest.fn(),
}));

jest.mock('./utils/encoding', () => ({
  ...jest.requireActual('./utils/encoding'),
  decodeResponseURLParams: jest.fn(),
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
        params: { name: 'test' },
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
    requestUrl.search = encodeRequestURLParams(mockRequest);
    jest.clearAllMocks();
  });

  it('should successfully post request to a web-based wallet', async () => {
    const webWallet: Wallet = { type: 'web', scheme: mockWalletScheme } as Wallet;
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
      type: 'success',
      url: 'https://example.com/response',
    });
    (decodeResponseURLParams as jest.Mock).mockResolvedValue(mockResponse);

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
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValue({
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
    (WebBrowser.openAuthSessionAsync as jest.Mock).mockRejectedValue(mockError);

    await expect(postRequestToWallet(mockRequest, mockAppCustomScheme, webWallet)).rejects.toThrow(
      'User rejected the request'
    );
  });
});
