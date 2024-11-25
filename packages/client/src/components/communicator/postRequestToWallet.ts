import { WebBasedWalletCommunicator } from './webBased/Communicator';
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
  wallet: Wallet,
  appCustomScheme?: string
): Promise<RPCResponseMessage> {
  const { type, scheme } = wallet;
  if (type === 'webBased') {
    return WebBasedWalletCommunicator.postRequestAndWaitForResponse(
      request,
      scheme,
      appCustomScheme
    );
  }

  if (type === 'native') {
    throw new Error('Native wallet not supported yet');
  }

  throw new Error('Unsupported wallet type');
}
