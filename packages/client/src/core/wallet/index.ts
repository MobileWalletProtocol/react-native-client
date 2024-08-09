export type Wallet =
  | {
      type: 'webBased';
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
    type: 'webBased',
    name: 'Coinbase Smart Wallet',
    scheme: 'https://keys.coinbase.com/connect',
    iconUrl: 'https://wallet.coinbase.com/assets/images/favicon.ico',
  },
  CoinbaseWalletApp: {
    type: 'native',
    name: 'Coinbase Wallet App',
    scheme: 'https://keys.coinbase.com/connect',
    iconUrl: 'https://wallet.coinbase.com/assets/images/favicon.ico',
    storeUrl: {
      appStore: 'https://apps.apple.com/app/coinbase-wallet/id1278383455',
      googlePlay: 'https://play.google.com/store/apps/details?id=org.toshi',
    },
  },
} as const;
