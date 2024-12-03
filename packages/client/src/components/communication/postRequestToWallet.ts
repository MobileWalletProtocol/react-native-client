import * as WebBrowser from 'expo-web-browser';

import { decodeResponseURLParams } from './utils/encoding';
import { encodeRequestURLParams } from './utils/encoding';
import { standardErrors } from ':core/error';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message';
import { Wallet } from ':core/wallet';

/**
 * Posts a request to a wallet and waits for the response.
 *
 * @param request - The request to send.
 * @param wallet - The wallet to send the request to.
 * @returns A promise that resolves to the response.
 */
export async function postRequestToWallet(
  request: RPCRequestMessage,
  appCustomScheme: string,
  wallet: Wallet
): Promise<RPCResponseMessage> {
  const { type, scheme } = wallet;

  if (type === 'webBased') {
    return new Promise((resolve, reject) => {
      // 1. generate request URL
      const requestUrl = new URL(scheme);
      requestUrl.search = encodeRequestURLParams(request);

      // 2. send request via Expo WebBrowser
      WebBrowser.openAuthSessionAsync(requestUrl.toString(), appCustomScheme, {
        preferEphemeralSession: false,
      })
        .then((result) => {
          if (result.type === 'cancel') {
            // iOS only: user cancelled the request
            reject(standardErrors.provider.userRejectedRequest());
            WebBrowser.dismissBrowser();
          }

          if (result.type === 'success') {
            const { searchParams } = new URL(result.url);
            const response = decodeResponseURLParams(searchParams);

            resolve(response);
          }
        })
        .catch(() => {
          reject(standardErrors.provider.userRejectedRequest());
          WebBrowser.dismissBrowser();
        });
    });
  }

  if (type === 'native') {
    throw new Error('Native wallet not supported yet');
  }

  throw new Error('Unsupported wallet type');
}
