import { SerializedEthereumRpcError } from ':core/error';

export type HashedContent =
  | {
      iv: string;
      cipherText: string;
    }
  | {
      failure: SerializedEthereumRpcError;
    };
