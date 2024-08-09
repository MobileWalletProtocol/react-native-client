export type CryptoKeyPair = {
  privateKey: CryptoKey;
  publicKey: CryptoKey;
};

export type CryptoKey = {
  type: 'private' | 'public' | 'secret';
  algorithm: {
    name: string;
    namedCurve?: string;
    length?: number;
  };
  extractable: boolean;
  usages: string[];
  _key: Uint8Array;
};
