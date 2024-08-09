// Copyright (c) 2018-2024 Coinbase, Inc. <https://www.coinbase.com/>
import { MWPClient } from './MWPClient';
export default MWPClient;

export { handleResponse } from './components/communicator';
export type { AppMetadata, Preference, ProviderInterface } from './core/provider/interface';
export { EIP1193Provider } from './interfaces/eip1193/EIP1193Provider';
export { MWPClient } from './MWPClient';
