# Mobile Wallet Protocol - React Native Client

[![npm](https://img.shields.io/npm/v/@mobile-wallet-protocol/client.svg)](https://www.npmjs.com/package/@mobile-wallet-protocol/client)

## Mobile Wallet Protocol Connects Your React Native App to Wallets

### Supported Wallets
1. [Coinbase Smart Wallet](https://keys.coinbase.com/onboarding)
   - [Documentation](https://www.smartwallet.dev/)

### Wallets on the Roadmap
1. Coinbase Wallet Mobile for [Android](https://play.google.com/store/apps/details?id=org.toshi&referrer=utm_source%3DWallet_LP) and [iOS](https://apps.apple.com/app/apple-store/id1278383455?pt=118788940&ct=Wallet_LP&mt=8)
1. Other wallets adopting the Mobile Wallet Protocol

### Integrate @MWP/client with Your App

Please refer to the [Smart Wallet Integration Guide](https://www.smartwallet.dev/guides/react-native-integration).

### Developing Locally and Running the Test App

- Test app available [here](https://github.com/MobileWalletProtocol/smart-wallet-expo-example).
- To develop locally, follow these steps:

   1. Fork this repository and clone it.
   2. Fork the test app repository and clone it.
   3. Develop for MWP Client.
   4. From the root directory of the MWP Client repository, run `yarn build`.
   5. From the root directory of the test app, run `yarn add "@mobile-wallet-protocol/client"@<your-path-to-MWP-client>`.
   6. From the root directory of the test app, run `yarn ios` or `yarn android` to see the result.


