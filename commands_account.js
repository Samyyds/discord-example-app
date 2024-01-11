import Web3Manager from './web3_manager.js';
import pkg from 'discord.js';
const { EmbedBuilder, AttachmentBuilder } = pkg;
import descriptions from './consts.js';
import userAccounts from './user_accounts.js';

const registerCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const signupEmbed = new EmbedBuilder();

        if (userAccounts.has(interaction.user.id)) {
            signupEmbed.setTitle('You are already registered');
            await interaction.editReply({ embeds: [signupEmbed], ephemeral: true });
            return;
        }

        //Each user has and only has one Web3 instance before logging out
        Web3Manager.setProviderForUser(interaction.user.id);
        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        //create ether wallet and seedphrase
        const { userAccount, seedphrase } = web3Provider.createAccount();
        //set mapping userAccounts(id => account)
        userAccounts.set(interaction.user.id, userAccount);
        //set mapping web3Provider(id => web3 instance)
        web3Provider.setCurrentAccount(interaction.user.id);

        const seedphraseFile = new AttachmentBuilder(Buffer.from(seedphrase), { name: 'RecoveryPhrase.txt' });
        signupEmbed.setTitle('Signup Success').setDescription(descriptions.SIGNUP_MESSAGE);

        await interaction.editReply({
            embeds: [signupEmbed],
            files: [seedphraseFile],
            ephemeral: true
        });
    } catch (error) {
        console.error('Error in register command:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while processing your request', ephemeral: true });
        }
    }
};

const loginCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const loginEmbed = new EmbedBuilder();

        if (userAccounts.has(interaction.user.id)) {
            loginEmbed.setTitle('You are already logged in');
            await interaction.editReply({ embeds: [loginEmbed], ephemeral: true });
            return;
        }

        const seedphrase = interaction.options.getString('seedphrase');
        Web3Manager.setProviderForUser(interaction.user.id);
        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        console.log('Before processing seedphrase');
        const { userAccount } = await web3Provider.processSeedphrase(seedphrase);
        console.log('After processing seedphrase', userAccount);
        userAccounts.set(interaction.user.id, userAccount);
        web3Provider.setCurrentAccount(interaction.user.id);

        loginEmbed.setTitle('Logged in successfully');
        await interaction.editReply({ embeds: [loginEmbed], ephemeral: true });
    }
    catch (error) {
        console.error('Login command failed:', error);
        await interaction.editReply({
            content: 'An error occurred during the login process',
            ephemeral: true
        });
    }
}

const logoutCommand = async (interaction) => {
    try {
        const logoutEmbed = new EmbedBuilder();

        if (!userAccounts.has(interaction.user.id)) {
            logoutEmbed.setTitle('You are not logged in');
            await interaction.reply({ embeds: [logoutEmbed], ephemeral: true });
            return;
        }

        userAccounts.delete(interaction.user.id);
        Web3Manager.removeProviderForUser(interaction.user.id);

        logoutEmbed.setTitle('Logged out successfully');
        await interaction.reply({ embeds: [logoutEmbed], ephemeral: true });

    } catch (error) {
        console.error('Logout command failed:', error);
        await interaction.reply({
            content: 'An error occurred during the logout process',
            ephemeral: true
        });
    }
}

export const accountCommands = {
    register: registerCommand,
    login: loginCommand,
    logout: logoutCommand
};

