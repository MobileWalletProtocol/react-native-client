import { LIB_VERSION } from '../../version';
import { standardErrorCodes } from './constants';
import { serialize } from './utils';

/**
 * Serializes an error to a format that is compatible with the Ethereum JSON RPC error format.
 * See https://docs.cloud.coinbase.com/wallet-sdk/docs/errors
 * for more information.
 */
export function serializeError(error: unknown) {
  const serialized = serialize(getErrorObject(error), {
    shouldIncludeStack: true,
  });

  const docUrl = new URL('https://docs.cloud.coinbase.com/wallet-sdk/docs/errors');
  docUrl.searchParams.set('version', LIB_VERSION);
  docUrl.searchParams.set('code', serialized.code.toString());
  docUrl.searchParams.set('message', serialized.message);

  return {
    ...serialized,
    docUrl: docUrl.href,
  };
}

type ErrorResponse = {
  method: unknown;
  errorCode?: number;
  errorMessage: string;
};

export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (response as ErrorResponse).errorMessage !== undefined;
}

/**
 * Converts an error to a serializable object.
 */
function getErrorObject(error: string | object | unknown) {
  if (typeof error === 'string') {
    return {
      message: error,
      code: standardErrorCodes.rpc.internal,
    };
  } else if (isErrorResponse(error)) {
    return {
      ...error,
      message: error.errorMessage,
      code: error.errorCode,
      data: { method: error.method },
    };
  }
  return error;
}
