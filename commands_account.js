import Web3Manager from './web3Manager.js';
import pkg from 'discord.js';
const { EmbedBuilder, AttachmentBuilder } = pkg;
import descriptions from './consts.js';
import userAccounts from './userAccounts.js';

const registerCommand = async (interaction) => {
    if (interaction.commandName !== 'register') return;

    try {
        await interaction.deferReply({ ephemeral: true });

        const signupEmbed = new EmbedBuilder();

        if (userAccounts.has(interaction.user.id)) {
            signupEmbed.setTitle('You are already registered');
            await interaction.editReply({ embeds: [signupEmbed], ephemeral: true });
            return;
        }

        const { userAccount, seedphrase } = Web3Manager.createAccount();
        userAccounts.set(interaction.user.id, userAccount);

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
    if (interaction.commandName !== 'login') return;
    try {
        await interaction.deferReply({ ephemeral: true });

        const loginEmbed = new EmbedBuilder();

        if (userAccounts.has(interaction.user.id)) {
            loginEmbed.setTitle('You are already logged in');
            await interaction.editReply({ embeds: [loginEmbed], ephemeral: true });
            return;
        }
        const seedphrase = interaction.options.getString('seedphrase');
        const { userAccount } = Web3Manager.processSeedphrase(seedphrase);
        userAccounts.set(interaction.user.id, userAccount);

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
            await interaction.reply({embeds: [logoutEmbed], ephemeral: true});
            return;
        }

        userAccounts.delete(interaction.user.id);
      
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

export const commands = {
    register: registerCommand,
    login: loginCommand,
    logout: logoutCommand
};

