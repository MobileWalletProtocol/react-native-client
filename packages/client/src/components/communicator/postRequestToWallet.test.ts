import { postRequestToWallet } from './postRequestToWallet';
import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message';
import { Wallet } from ':core/wallet';

jest.mock('./webBased/Communicator', () => ({
  WebBasedWalletCommunicator: {
    postRequestAndWaitForResponse: jest.fn(),
  },
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully post request to a web-based wallet', async () => {
    const webBasedWallet: Wallet = { type: 'webBased', scheme: 'https' } as Wallet;
    (WebBasedWalletCommunicator.postRequestAndWaitForResponse as jest.Mock).mockResolvedValue(
      mockResponse
    );

    const result = await postRequestToWallet(mockRequest, webBasedWallet);

    expect(WebBasedWalletCommunicator.postRequestAndWaitForResponse).toHaveBeenCalledWith(
      mockRequest,
      'https'
    );
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error for native wallet type', async () => {
    const nativeWallet: Wallet = { type: 'native', scheme: 'native' } as Wallet;

    await expect(postRequestToWallet(mockRequest, nativeWallet)).rejects.toThrow(
      'Native wallet not supported yet'
    );
  });

  it('should throw an error for unsupported wallet type', async () => {
    const unsupportedWallet: Wallet = { type: 'unsupported' as any, scheme: 'unknown' } as Wallet;

    await expect(postRequestToWallet(mockRequest, unsupportedWallet)).rejects.toThrow(
      'Unsupported wallet type'
    );
  });

  it('should pass through any errors from WebBasedWalletCommunicator', async () => {
    const webBasedWallet: Wallet = { type: 'webBased', scheme: 'https' } as Wallet;
    const mockError = new Error('Communication error');
    (WebBasedWalletCommunicator.postRequestAndWaitForResponse as jest.Mock).mockRejectedValue(
      mockError
    );

    await expect(postRequestToWallet(mockRequest, webBasedWallet)).rejects.toThrow(
      'Communication error'
    );
  });
});
