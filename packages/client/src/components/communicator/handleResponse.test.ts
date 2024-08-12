import { handleResponse } from './handleResponse';
import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { MWP_RESPONSE_PATH } from ':core/constants';

jest.mock('./webBased/Communicator', () => ({
  WebBasedWalletCommunicator: {
    handleResponse: jest.fn(),
  },
}));

describe('handleResponse', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if the pathname does not include MWP_RESPONSE_PATH', () => {
    const responseUrl = 'https://example.com/some-other-path';
    const result = handleResponse(responseUrl);
    expect(result).toBe(false);
    expect(WebBasedWalletCommunicator.handleResponse).not.toHaveBeenCalled();
  });

  it('should return true if WebBasedWalletCommunicator handles the response successfully', () => {
    const responseUrl = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    (WebBasedWalletCommunicator.handleResponse as jest.Mock).mockReturnValue(true);

    const result = handleResponse(responseUrl);

    expect(result).toBe(true);
    expect(WebBasedWalletCommunicator.handleResponse).toHaveBeenCalledWith(responseUrl);
  });

  it('should return false if WebBasedWalletCommunicator does not handle the response', () => {
    const responseUrl = `https://example.com/${MWP_RESPONSE_PATH}/some-params`;
    (WebBasedWalletCommunicator.handleResponse as jest.Mock).mockReturnValue(false);

    const result = handleResponse(responseUrl);

    expect(result).toBe(false);
    expect(WebBasedWalletCommunicator.handleResponse).toHaveBeenCalledWith(responseUrl);
  });

  it('should handle different URL formats correctly', () => {
    const responseUrls = [
      `https://example.com/${MWP_RESPONSE_PATH}`,
      `https://example.com/${MWP_RESPONSE_PATH}/`,
      `https://example.com/${MWP_RESPONSE_PATH}?param=value`,
      `https://example.com/${MWP_RESPONSE_PATH}/?param=value`,
    ];

    responseUrls.forEach((url) => {
      (WebBasedWalletCommunicator.handleResponse as jest.Mock).mockReturnValue(true);
      expect(handleResponse(url)).toBe(true);
      expect(WebBasedWalletCommunicator.handleResponse).toHaveBeenCalledWith(url);
    });
  });

  it('should throw an error for invalid URLs', () => {
    const invalidUrl = 'not-a-valid-url';
    expect(() => handleResponse(invalidUrl)).toThrow('Invalid URL');
  });
});
