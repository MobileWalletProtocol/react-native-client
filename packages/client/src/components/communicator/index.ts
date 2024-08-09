import { CommunicatorInterface } from './interface';
import { WebBasedWalletCommunicator } from './webBased/Communicator';
import { Wallet } from ':core/wallet';

export * from './handleResponse';
export * from './interface';

export class Communicator {
  private constructor() {}

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
