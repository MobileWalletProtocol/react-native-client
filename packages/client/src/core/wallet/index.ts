export type Wallet =
  | {
      type: 'web';
      name: string;
      scheme: string;
      iconUrl?: string;
    }
  | {
      type: 'native';
      name: string;
      scheme: string;
      storeUrl: {
        appStore: string;
        googlePlay: string;
      };
      iconUrl?: string;
    };

export const Wallets = {
  CoinbaseSmartWallet: {
    type: 'web',
    name: 'Coinbase Smart Wallet',
    scheme: 'https://keys.coinbase.com/connect',
    iconUrl: 'https://wallet.coinbase.com/assets/images/favicon.ico',
  },
} as const;
