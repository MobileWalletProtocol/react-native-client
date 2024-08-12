import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { MWP_RESPONSE_PATH } from ':core/constants';

/**
 * Handles the response from a deeplink.
 *
 * @param responseUrl - The URL of the response.
 * @returns A boolean indicating whether the response was handled successfully.
 */
export function handleResponse(responseUrl: string): boolean {
  const pathname = new URL(responseUrl).pathname;

  if (!pathname.includes(MWP_RESPONSE_PATH)) {
    return false;
  }

  if (WebBasedWalletCommunicator.handleResponse(responseUrl)) {
    return true;
  }

  // NativeWalletCommunicator.handleResponse

  return false;
}
