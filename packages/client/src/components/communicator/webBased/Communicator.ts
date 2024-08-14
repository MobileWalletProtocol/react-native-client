import * as WebBrowser from 'expo-web-browser';

import { decodeResponseURLParams, encodeRequestURLParams } from './encoding';
import { standardErrors } from ':core/error';
import { MessageID, RPCRequestMessage, RPCResponseMessage } from ':core/message';

class WebBasedWalletCommunicatorClass {
  private responseHandlers = new Map<MessageID, (_: RPCResponseMessage) => void>();

  postRequestAndWaitForResponse = (
    request: RPCRequestMessage,
    walletScheme: string
  ): Promise<RPCResponseMessage> => {
    return new Promise((resolve, reject) => {
      // 1. generate request URL
      const requestUrl = new URL(walletScheme);
      requestUrl.search = encodeRequestURLParams(request);

      // 2. save response
      this.responseHandlers.set(request.id, resolve);

      // 3. send request via native module
      WebBrowser.openBrowserAsync(requestUrl.toString(), {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      })
        .then((result) => {
          if (result.type === 'cancel') {
            // iOS only: user cancelled the request
            reject(standardErrors.provider.userRejectedRequest());
            this.disconnect();
          }
        })
        .catch(() => {
          reject(standardErrors.provider.userRejectedRequest());
          this.disconnect();
        });
    });
  };

  handleResponse = (responseUrl: string): boolean => {
    const { searchParams } = new URL(responseUrl);
    const response = decodeResponseURLParams(searchParams);

    const handler = this.responseHandlers.get(response.requestId);
    if (handler) {
      handler(response);
      this.responseHandlers.delete(response.requestId);
      WebBrowser.dismissBrowser();
      return true;
    }
    return false;
  };

  private disconnect = () => {
    WebBrowser.dismissBrowser();
    this.responseHandlers.clear();
  };
}

export const WebBasedWalletCommunicator = new WebBasedWalletCommunicatorClass();
