import { Message, MessageID } from './Message';
import { SerializedEthereumRpcError } from ':core/error';

interface RPCMessage extends Message {
  id: MessageID;
  sender: string; // hex encoded public key of the sender
  content: unknown;
  timestamp: Date;
}

export type EncryptedData = {
  iv: Uint8Array;
  cipherText: Uint8Array;
};

export interface RPCRequestMessage extends RPCMessage {
  sdkVersion: string;
  callbackUrl: string;
  customScheme?: string;
  content:
    | {
        handshake: RequestAccountsAction;
      }
    | {
        encrypted: EncryptedData;
      };
}

export interface RPCResponseMessage extends RPCMessage {
  requestId: MessageID;
  content:
    | {
        encrypted: EncryptedData;
      }
    | {
        failure: SerializedEthereumRpcError;
      };
}

type RequestAccountsAction = {
  method: 'eth_requestAccounts';
  params: {
    appName: string;
    appLogoUrl?: string;
  };
};
