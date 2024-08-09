import { RPCRequestMessage, RPCResponseMessage } from ':core/message';

export interface CommunicatorInterface {
  postRequestAndWaitForResponse: (message: RPCRequestMessage) => Promise<RPCResponseMessage>;
  handleResponse: (responseUrl: string) => boolean;
}
