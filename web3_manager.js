import Web3Provider from './web3_provider.js';
import userAccounts from './user_accounts.js';

class Web3Manager {
    constructor() {
        this.providers = new Map();
    }

    setProviderForUser(userId) {
        if (!this.providers.has(userId)) {
            const accountData = userAccounts[userId] || null;
            this.providers.set(userId, new Web3Provider(accountData));
        }
    }

    getProviderForUser(userId) {
        return this.providers.get(userId);
    }

    removeProviderForUser(userId) {
        this.providers.delete(userId);
    }
}

export default new Web3Manager();
