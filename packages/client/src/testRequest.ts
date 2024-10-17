import {MWPClient} from "./MWPClient";
import {Wallets} from ":core/wallet";

async function testProviderRequest() {
    // Initialize SDK
    const sdk = await MWPClient.createInstance({metadata: {appName: 'Test App', appDeeplinkUrl: 'test://deeplink'}, wallet: Wallets.CoinbaseSmartWallet});

    try {
        // Request accounts to initialize connection to wallet
        const addresses = await sdk.request({
            method: 'eth_requestAccounts',
        });

        console.log('Connected addresses:', addresses);

        // Make another request (e.g., personal_sign)
        const message = 'test message';
        const signature = await sdk.request({
            method: 'personal_sign',
            params: [
                `0x${Buffer.from(message, 'utf8').toString('hex')}`,
                addresses[0],
            ],
        });

        console.log('Signature:', signature);
    } catch (error) {
        console.error('Error making provider request:', error);
    }
}

testProviderRequest();