import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { RPCRequestMessage, RPCResponseMessage } from ':core/message';
import { Wallet } from ':core/wallet';

export interface CommunicatorInterface {
  postRequestAndWaitForResponse: (message: RPCRequestMessage) => Promise<RPCResponseMessage>;
  handleResponse: (responseUrl: string) => boolean;
}

export class Communicator {
  static getInstance(wallet: Wallet): CommunicatorInterface {
    const { type, scheme } = wallet;

    if (type === 'webBased') {
      return WebBasedWalletCommunicator.getInstance(scheme);
    }

    if (type === 'native') {
      throw new Error('Native wallet not supported yet');
    }

    throw new Error('Unsupported wallet type');
  }
}
