import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

import type { SerializedEthereumRpcError } from ':core/error';
import type {
  MessageID,
  RequestAccountsAction,
  RPCRequestMessage,
  RPCResponseMessage,
} from ':core/message';

type FailureResponseContent = {
  failure: SerializedEthereumRpcError;
};

type EncryptedResponseContent = {
  encrypted: {
    iv: string;
    cipherText: string;
  };
};

type SegmentResponseContent = {
  segment: {
    ack: boolean;
    index: number;
  };
};

type EncodedResponseContent =
  | FailureResponseContent
  | EncryptedResponseContent
  | SegmentResponseContent;

type SegmentResponseMessage = Omit<RPCResponseMessage, 'content'> & {
  content: SegmentResponseContent;
};

type ResponseMessage = RPCResponseMessage | SegmentResponseMessage;

export function decodeResponseURLParams(params: URLSearchParams): ResponseMessage {
  const parseParam = <T>(paramName: string) => {
    const encodedValue = params.get(paramName);
    if (!encodedValue) throw new Error(`Missing parameter: ${paramName}`);
    return JSON.parse(encodedValue) as T;
  };

  const contentParam = parseParam<EncodedResponseContent>('content');

  let content: ResponseMessage['content'];

  if ('failure' in contentParam || 'segment' in contentParam) {
    content = contentParam;
  }

  if ('encrypted' in contentParam) {
    const { iv, cipherText } = contentParam.encrypted;
    content = {
      encrypted: {
        iv: hexToBytes(iv),
        cipherText: hexToBytes(cipherText),
      },
    };
  }

  return {
    id: parseParam<MessageID>('id'),
    sender: parseParam<string>('sender'),
    requestId: parseParam<MessageID>('requestId'),
    timestamp: new Date(parseParam<string>('timestamp')),
    content: content!,
  } as ResponseMessage;
}

type HandshakeRequestMessageContent = {
  handshake: RequestAccountsAction;
};

type EncryptedRequestMessageContent = {
  encrypted: {
    iv: string;
    cipherText: string;
  };
};

type EncryptedSegmentMessageContent = {
  segment: {
    totalSize: number;
    index: number;
    data: string;
  };
};

type MobileRPCRequestMessageContent =
  | HandshakeRequestMessageContent
  | EncryptedRequestMessageContent
  | EncryptedSegmentMessageContent;

export type MobileRequestMessage = Omit<RPCRequestMessage, 'content'> & {
  content: MobileRPCRequestMessageContent;
};

export function encodeRequestURLParams(request: MobileRequestMessage) {
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
  appendParam('content', request.content);

  return urlParams.toString();
}

const MAX_SEGMENT_SIZE = 5000;

export function segmentRequest(request: RPCRequestMessage): MobileRequestMessage[] {
  const segments: MobileRequestMessage[] = [];

  if ('handshake' in request.content) {
    segments.push(request as MobileRequestMessage);
  }

  if ('encrypted' in request.content) {
    const { iv, cipherText } = request.content.encrypted;
    const ivHex = bytesToHex(new Uint8Array(iv));
    const cipherTextHex = bytesToHex(new Uint8Array(cipherText));

    if (ivHex.length + cipherTextHex.length <= MAX_SEGMENT_SIZE) {
      // request is smaller than the segment size, so don't segment it
      segments.push({
        ...request,
        content: {
          encrypted: {
            iv: ivHex,
            cipherText: cipherTextHex,
          },
        },
      });
    } else {
      // split the request into segments
      const encryptedData = `${ivHex}:${cipherTextHex}`;
      for (let i = 0; i < encryptedData.length; i += MAX_SEGMENT_SIZE) {
        segments.push({
          ...request,
          content: {
            segment: {
              totalSize: encryptedData.length,
              index: i / MAX_SEGMENT_SIZE,
              data: encryptedData.slice(i, i + MAX_SEGMENT_SIZE),
            },
          },
        });
      }
    }
  }

  return segments;
}
