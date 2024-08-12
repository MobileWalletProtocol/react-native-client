import * as WebBrowser from 'expo-web-browser';

import { HashedContent } from './types';
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
      const urlParams = new URLSearchParams();
      Object.entries(request).forEach(([key, value]) => {
        urlParams.append(key, JSON.stringify(value));
      });
      const requestUrl = new URL(walletScheme);
      requestUrl.search = urlParams.toString();

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
    const parseParam = <T>(paramName: string) => {
      return JSON.parse(searchParams.get(paramName) as string) as T;
    };

    const hashedContent = parseParam<HashedContent>('content');

    // TODO: un-hash content
    const content = hashedContent as RPCResponseMessage['content'];

    const response: RPCResponseMessage = {
      id: parseParam<MessageID>('id'),
      sender: parseParam<string>('sender'),
      requestId: parseParam<MessageID>('requestId'),
      content,
      timestamp: new Date(parseParam<string>('timestamp')),
    };

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
