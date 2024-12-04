import { Buffer } from 'buffer';

import type { SerializedEthereumRpcError } from ':core/error';
import type { MessageID, RPCRequestMessage, RPCResponseMessage } from ':core/message';

type EncodedResponseContent =
  | { failure: SerializedEthereumRpcError }
  | {
      encrypted: {
        iv: string;
        cipherText: string;
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
        iv: new Uint8Array(Buffer.from(iv, 'base64')),
        cipherText: new Uint8Array(Buffer.from(cipherText, 'base64')),
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
    if (value) urlParams.append(key, JSON.stringify(value));
  };

  appendParam('id', request.id);
  appendParam('sender', request.sender);
  appendParam('sdkVersion', request.sdkVersion);
  appendParam('callbackUrl', request.callbackUrl);
  appendParam('customScheme', request.customScheme);
  appendParam('timestamp', request.timestamp);

  if ('handshake' in request.content) {
    appendParam('content', request.content);
  }

  if ('encrypted' in request.content) {
    const encrypted = request.content.encrypted;
    const ivBytes = new Uint8Array(encrypted.iv);
    const cipherTextBytes = new Uint8Array(encrypted.cipherText);
    appendParam('content', {
      encrypted: {
        iv: Buffer.from(ivBytes).toString('base64'),
        cipherText: Buffer.from(cipherTextBytes).toString('base64'),
      },
    });
  }

  return urlParams.toString();
}
