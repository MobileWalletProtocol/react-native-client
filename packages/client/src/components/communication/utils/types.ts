import { SerializedEthereumRpcError } from ':core/error/index.js';

export type HashedContent =
  | {
      iv: string;
      cipherText: string;
    }
  | {
      failure: SerializedEthereumRpcError;
    };
