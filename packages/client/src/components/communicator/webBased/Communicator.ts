import * as WebBrowser from 'expo-web-browser';

import { decodeResponseURLParams, encodeRequestURLParams } from './encoding';
import { standardErrors } from ':core/error';
import { MessageID, RPCRequestMessage, RPCResponseMessage } from ':core/message';

class WebBasedWalletCommunicatorClass {
  private responseHandlers = new Map<MessageID, (_: RPCResponseMessage) => void>();

  postRequestAndWaitForResponse = (
    request: RPCRequestMessage,
    walletScheme: string,
    appCustomScheme?: string
  ): Promise<RPCResponseMessage> => {
    return new Promise((resolve, reject) => {
      // 1. generate request URL
      const requestUrl = new URL(walletScheme);
      requestUrl.search = encodeRequestURLParams(request);

      // 2. save response
      this.responseHandlers.set(request.id, resolve);

      // 3. send request via native module
      WebBrowser.openAuthSessionAsync(requestUrl.toString(), appCustomScheme, {
        preferEphemeralSession: false,
      })
        .then((result) => {
          console.log('customlogs: result', result);
          if (result.type === 'cancel') {
            // iOS only: user cancelled the request
            reject(standardErrors.provider.userRejectedRequest());
            this.disconnect();
          }
          if (result.type === 'success') {
            this.handleResponse(result.url);
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
      // dismissBrowser only returns a promise on iOS for when Expo SDK is >= 52
      const dismissResult = WebBrowser.dismissBrowser() as Promise<unknown> | void;
      if (dismissResult && typeof dismissResult.then === 'function') {
        // If dismissBrowser returns a promise, handle it asynchronously
        dismissResult.then(() => {
          handler(response);
          this.responseHandlers.delete(response.requestId);
        });
      } else {
        // If dismissBrowser is undefined or doesn't return a promise (Android case), handle synchronously
        handler(response);
        this.responseHandlers.delete(response.requestId);
      }
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
