import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { MWP_RESPONSE_PATH } from ':core/constants';
import { Wallet } from ':core/wallet';

/**
 * Handles the response from a deeplink.
 *
 * @param responseUrl - The URL of the response.
 * @param wallet - The wallet object.
 * @returns A boolean indicating whether the response was handled successfully.
 */
export function handleResponse(responseUrl: string, wallet: Wallet): boolean {
  const pathname = new URL(responseUrl).pathname;

  if (!pathname.includes(MWP_RESPONSE_PATH)) {
    return false;
  }

  if (wallet.type === 'webBased') {
    const communicator = WebBasedWalletCommunicator.getInstance(wallet.scheme);
    return communicator.handleResponse(responseUrl);
  }

  if (wallet.type === 'native') {
    throw new Error('Native wallet not supported yet');
  }

  return false;
}
