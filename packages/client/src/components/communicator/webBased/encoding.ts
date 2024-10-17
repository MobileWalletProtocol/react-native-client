import * as fflate from 'fflate'; // TODO: only import what we need
import { encode, decode } from "@msgpack/msgpack";

import type { RPCRequestMessage, RPCResponseMessage } from ':core/message';

export function decodeResponseURLParams(params: URLSearchParams): RPCResponseMessage {
  const data = params.get('q');
  if (!data) throw new Error(`Missing parameter: q`);
  let compressedData = atob(data)
  const len = compressedData.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = compressedData.charCodeAt(i);
  }
  let binData = fflate.unzlibSync(bytes)
  let request = decode(binData) as RPCRequestMessage

  const contentParam = request.content;

  let content: RPCResponseMessage['content'];
  if ('failure' in contentParam) {
    content = contentParam as { failure: any };
  }

  return <RPCResponseMessage>{
    id: request.id,
    sender: request.sender,
    requestId: request.requestId,
    timestamp: request.timestamp,
    content: content!,
  };
}

export function encodeRequestURLParams(request: RPCRequestMessage) {
  const urlParams = new URLSearchParams();
  let ret = encode(request);
  ret = fflate.zlibSync(ret)
  let dataStr = btoa(String.fromCharCode(...ret))
  urlParams.append("q", dataStr)
  return urlParams.toString();
}
