import Web3 from 'web3';
import { ethers } from 'ethers';
import userAccounts from './user_accounts.js';
import addresses from './addresses.json' assert { type: 'json' };
import fs from 'fs';
import path from 'path';

class Web3Provider {
    constructor(accountData) {
        this.web3 = new Web3(process.env.WEB3_NETWORK);
        this.currentAccount = accountData || null;
    }

    setCurrentAccount(userId) {
        this.currentAccount = userAccounts[userId];
    }

    createAccount() {
        const wallet = ethers.Wallet.createRandom();
        const userAccount = wallet;
        const seedphrase = wallet.mnemonic.phrase;
        return { userAccount, seedphrase }
    }

    processSeedphrase = async (seedphrase) => {
        try {
            const wallet = ethers.Wallet.fromPhrase(seedphrase);
            return { wallet };
        } catch (error) {
            console.error('Error processing seedphrase:', error);
            throw error;
        }
    }

    getAddressByContractName(name) {
        const address = addresses[name];
        if (address) {
            return address;
        } else {
            throw new Error(`Address not found by name: ${name}`);
        }
    }

    getABIByContractName(name) {
        try {
            const abiPath = path.join(path.resolve(), 'abi', `${name}.abi`);
            const abiContent = fs.readFileSync(abiPath, 'utf8');
            return JSON.parse(abiContent);
        } catch (error) {
            console.error(`Error reading ABI file: ${error.message}`);
            throw error;
        }
    }

    sendTransaction = async (contractName, methodName, params, value = '0x0') => {
        try {
            const abi = this.getABIByContractName(contractName);
            const contract = new this.web3.eth.Contract(abi, this.getAddressByContractName(contractName));

            if (!this.currentAccount || !this.currentAccount.privateKey) {
                throw new Error('Current account does not have a private key set.');
            }

            const fromAddress = this.currentAccount.address;
            const txParams = {
                from: fromAddress,
                to: contract.options.address,
                data: contract.methods[methodName](...params).encodeABI(),
                value: value
            };
            // Estimate gas for the transaction
            const gasEstimate = await this.web3.eth.estimateGas(txParams);
            // Set gas limit slightly higher than estimated gas
            txParams.gas = Math.floor(gasEstimate * 1.2);

            const signedTx = await this.web3.eth.accounts.signTransaction(txParams, this.currentAccount.privateKey);
            const receipt = await this.web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            return receipt;
        } catch (error) {
            console.error(`Error in sendTransaction: ${error.message}`);
            throw error;
        }
    }

    queryContract = async (contractName, methodName, params = []) => {
        try {
            const abi = this.getABIByContractName(contractName);
            const contractAddress = this.getAddressByContractName(contractName);
            const contract = new this.web3.eth.Contract(abi, contractAddress);

            const result = await contract.methods[methodName](...params).call();
            return result;
        } catch (error) {
            console.error(`Error in queryContract: ${error.message}`);
            throw error;
        }
    }
}

export default Web3Provider;