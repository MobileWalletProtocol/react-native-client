import { handleResponse } from './handleResponse';
import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { MWP_RESPONSE_PATH } from ':core/constants';
import { Wallet } from ':core/wallet';

jest.mock('./webBased/Communicator');
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: jest.fn(),
}));

describe('handleResponse', () => {
  const mockWebBasedWallet = { type: 'webBased', scheme: 'https://example.com' } as Wallet;
  const mockNativeWallet = { type: 'native' } as Wallet;
  const mockOtherWallet = { type: 'other' as any } as Wallet;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns false for non-MWP response URLs', () => {
    const url = 'https://example.com/some-path';
    expect(handleResponse(url, mockWebBasedWallet)).toBe(false);
  });

  test('handles web-based wallet response correctly', () => {
    const url = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    const mockHandleResponse = jest.fn().mockReturnValue(true);
    (WebBasedWalletCommunicator.getInstance as jest.Mock).mockReturnValue({
      handleResponse: mockHandleResponse,
    });

    const result = handleResponse(url, mockWebBasedWallet);

    expect(WebBasedWalletCommunicator.getInstance).toHaveBeenCalledWith(mockWebBasedWallet.scheme);
    expect(mockHandleResponse).toHaveBeenCalledWith(url);
    expect(result).toBe(true);
  });

  test('throws error for native wallet', () => {
    const url = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    expect(() => handleResponse(url, mockNativeWallet)).toThrow('Native wallet not supported yet');
  });

  test('returns false for unsupported wallet types', () => {
    const url = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    expect(handleResponse(url, mockOtherWallet)).toBe(false);
  });

  test('WebBasedWalletCommunicator.handleResponse returns false', () => {
    const url = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    const mockHandleResponse = jest.fn().mockReturnValue(false);
    (WebBasedWalletCommunicator.getInstance as jest.Mock).mockReturnValue({
      handleResponse: mockHandleResponse,
    });

    const result = handleResponse(url, mockWebBasedWallet);

    expect(mockHandleResponse).toHaveBeenCalledWith(url);
    expect(result).toBe(false);
  });
});
