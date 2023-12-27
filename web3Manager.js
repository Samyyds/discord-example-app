import Web3 from 'web3';
import { ethers } from 'ethers';

class Web3Manager {
    constructor() {
        this.Web3 = new Web3('https://staging-v3.skalenodes.com/v1/staging-utter-unripe-menkar');
    }

    createMnemonic() {
        const wallet = ethers.Wallet.createRandom();

        const mnemonic = wallet.mnemonic.phrase;

        return { mnemonic };
    }
}
export default new Web3Manager();