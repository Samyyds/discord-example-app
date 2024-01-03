import Web3 from 'web3';
import { ethers } from 'ethers';

class Web3Manager {
    constructor() {
        this.Web3 = new Web3('https://staging-v3.skalenodes.com/v1/staging-utter-unripe-menkar');
    }

    createAccount() {
        const wallet = ethers.Wallet.createRandom();
        const userAccount = wallet;
        const seedphrase = wallet.mnemonic.phrase;
        return { userAccount, seedphrase }
    }

    processSeedphrase = async (seedphrase) => {
        const wallet = ethers.Wallet.fromPhrase(seedphrase);
        return { wallet }
    }
}
export default new Web3Manager();