import { Communicator } from './Communicator';
import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { Wallet } from ':core/wallet';

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: {
    FORM_SHEET: 'FORM_SHEET',
  },
  dismissBrowser: jest.fn(),
}));

jest.mock('./webBased/Communicator');

describe('Communicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getInstance returns WebBasedWalletCommunicator for web-based wallet', () => {
    const mockWebBasedWallet: Wallet = { type: 'webBased', scheme: 'test-scheme://' } as Wallet;
    const mockCommunicator = {
      postRequestAndWaitForResponse: jest.fn(),
      handleResponse: jest.fn(),
    };
    (WebBasedWalletCommunicator.getInstance as jest.Mock).mockReturnValue(mockCommunicator);

    const result = Communicator.getInstance(mockWebBasedWallet);

    expect(WebBasedWalletCommunicator.getInstance).toHaveBeenCalledWith('test-scheme://');
    expect(result).toBe(mockCommunicator);
  });

  test('getInstance throws error for native wallet', () => {
    const mockNativeWallet: Wallet = { type: 'native', scheme: 'native-scheme://' } as Wallet;

    expect(() => Communicator.getInstance(mockNativeWallet)).toThrow(
      'Native wallet not supported yet'
    );
  });

  test('getInstance throws error for unsupported wallet type', () => {
    const mockUnsupportedWallet: Wallet = {
      type: 'unsupported' as any,
      scheme: 'unsupported-scheme://',
    } as Wallet;

    expect(() => Communicator.getInstance(mockUnsupportedWallet)).toThrow(
      'Unsupported wallet type'
    );
  });
});
