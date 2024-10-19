import * as WebBrowser from 'expo-web-browser';

import {
  decodeResponseURLParams,
  encodeRequestURLParams,
  MobileRequestMessage,
  segmentRequest,
} from './encoding';
import { standardErrors } from ':core/error';
import { MessageID, RPCRequestMessage, RPCResponseMessage } from ':core/message';

type ResponseHandler = {
  resolve: (response: RPCResponseMessage) => void;
  reject: (error: Error) => void;
};

type SegmentHandler = () => void;

class WebBasedWalletCommunicatorClass {
  private responseHandlers = new Map<MessageID, ResponseHandler>();
  private segmentHandlers = new Map<MessageID, SegmentHandler>();

  postRequestAndWaitForResponse = (
    request: RPCRequestMessage,
    walletScheme: string
  ): Promise<RPCResponseMessage> => {
    return new Promise((resolve, reject) => {
      this.responseHandlers.set(request.id, { resolve, reject });

      const segments = segmentRequest(request);
      this.sendSegments(segments, walletScheme);
    });
  };

  handleResponse = (responseUrl: string): boolean => {
    const { searchParams } = new URL(responseUrl);
    const response = decodeResponseURLParams(searchParams);

    WebBrowser.dismissBrowser();
    setTimeout(() => {
      // resolve any pending segment request after a delay to ensure the browser is dismissed
      this.resolvePendingSegment(response.requestId);
    }, 750);

    if ('segment' in response.content && response.content.segment.ack) {
      // don't resolve the request if the response is a segment ack
      return true;
    }

    if ('failure' in response.content || 'encrypted' in response.content) {
      return this.resolvePendingRequest(response.requestId, response as RPCResponseMessage);
    }

    return false;
  };

  private sendSegments = async (segments: MobileRequestMessage[], walletScheme: string) => {
    for (const segment of segments) {
      await new Promise<void>((resolve) => {
        this.segmentHandlers.set(segment.id, resolve);

        const requestUrl = new URL(walletScheme);
        requestUrl.search = encodeRequestURLParams(segment);

        WebBrowser.openBrowserAsync(requestUrl.toString(), {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        })
          .then((result) => {
            if (result.type === 'cancel') {
              // iOS only: user cancelled the request
              this.rejectPendingRequest(segment.id, standardErrors.provider.userRejectedRequest());
              this.disconnect();
            }
          })
          .catch(() => {
            this.rejectPendingRequest(segment.id, standardErrors.provider.userRejectedRequest());
            this.disconnect();
          });
      });
    }
  };

  private rejectPendingRequest = (requestId: MessageID, error: Error) => {
    const handler = this.responseHandlers.get(requestId);
    if (handler) {
      handler.reject(error);
      this.responseHandlers.delete(requestId);
      return true;
    }
    return false;
  };

  private resolvePendingRequest = (requestId: MessageID, response: RPCResponseMessage) => {
    const handler = this.responseHandlers.get(requestId);
    if (handler) {
      handler.resolve(response);
      this.responseHandlers.delete(requestId);
      return true;
    }
    return false;
  };

  private resolvePendingSegment = (requestId: MessageID) => {
    const handler = this.segmentHandlers.get(requestId);
    if (handler) {
      handler();
      this.segmentHandlers.delete(requestId);
      return true;
    }
    return false;
  };

  private disconnect = () => {
    WebBrowser.dismissBrowser();
    this.responseHandlers.clear();
    this.segmentHandlers.clear();
  };
}

export const WebBasedWalletCommunicator = new WebBasedWalletCommunicatorClass();
