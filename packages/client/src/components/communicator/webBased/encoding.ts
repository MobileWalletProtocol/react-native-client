import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import type { SerializedEthereumRpcError } from ':core/error';
import type { MessageID, RPCRequestMessage, RPCResponseMessage } from ':core/message';

type EncodedResponseContent =
  | { failure: SerializedEthereumRpcError }
  | {
      encrypted: {
        iv: string | Record<string, number>;
        cipherText: string | Record<string, number>;
      };
    };

export function decodeResponseURLParams(params: URLSearchParams): RPCResponseMessage {
  const parseParam = <T>(paramName: string) => {
    const encodedValue = params.get(paramName);
    if (!encodedValue) throw new Error(`Missing parameter: ${paramName}`);
    return JSON.parse(encodedValue) as T;
  };

  const contentParam = parseParam<EncodedResponseContent>('content');

  let content: RPCResponseMessage['content'];
  if ('failure' in contentParam) {
    content = contentParam;
  }

  if ('encrypted' in contentParam) {
    const { iv, cipherText } = contentParam.encrypted;
    content = {
      encrypted: {
        iv: typeof iv === 'string' ? hexToBytes(iv) : convertObjectToUint8Array(iv),
        cipherText:
          typeof cipherText === 'string'
            ? hexToBytes(cipherText)
            : convertObjectToUint8Array(cipherText),
      },
    };
  }

  return {
    id: parseParam<MessageID>('id'),
    sender: parseParam<string>('sender'),
    requestId: parseParam<MessageID>('requestId'),
    timestamp: new Date(parseParam<string>('timestamp')),
    content: content!,
  };
}

export function encodeRequestURLParams(request: RPCRequestMessage) {
  const urlParams = new URLSearchParams();
  const appendParam = (key: string, value: unknown) => {
    urlParams.append(key, JSON.stringify(value));
  };

  appendParam('id', request.id);
  appendParam('sender', request.sender);
  appendParam('sdkVersion', request.sdkVersion);
  appendParam('callbackUrl', request.callbackUrl);
  appendParam('timestamp', request.timestamp);

  if ('handshake' in request.content) {
    appendParam('content', request.content);
  }

  if ('encrypted' in request.content) {
    const encrypted = request.content.encrypted;
    appendParam('content', {
      encrypted: {
        iv: bytesToHex(new Uint8Array(encrypted.iv)),
        cipherText: bytesToHex(new Uint8Array(encrypted.cipherText)),
      },
    });
  }

  return urlParams.toString();
}

/**
 * Converts from a JSON.stringify-ied object to a Uint8Array
 * `{ "0": 1, "1": 2, "2": 3 }` to `Uint8Array([1, 2, 3])`
 */
function convertObjectToUint8Array(obj: Record<string, number>): Uint8Array {
  const length = Object.keys(obj).length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = obj[i];
  }

  return bytes;
}
