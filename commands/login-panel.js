import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } from 'discord.js';
import Web3Manager from '../web3/web3_manager.js';
import userAccounts from '../data/user_accounts.js';
import descriptions from '../data/consts.js';

class AccountManagementView {
    constructor(bot) {
        this.bot = bot;
    }

    getLoginPanel() {
        const signupButton = new ButtonBuilder()
            .setCustomId('account-management:sign-up-button')
            .setLabel('Sign Up')
            .setStyle(ButtonStyle.Success);

        const loginButton = new ButtonBuilder()
            .setCustomId('account-management:log-in-button')
            .setLabel('Log In')
            .setStyle(ButtonStyle.Primary);

        const logoutButton = new ButtonBuilder()
            .setCustomId('account-management:log-out-button')
            .setLabel('Log Out')
            .setStyle(ButtonStyle.Danger);

        const actionRow = new ActionRowBuilder()
            .addComponents(signupButton, loginButton, logoutButton);

        const embed = new EmbedBuilder()
            .setTitle('Welcome to Merfolk and Magic')
            .setDescription(descriptions.LOGIN_DES);

        return { embeds: [embed], components: [actionRow] };
    }

    async handleSignUp(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            let signupEmbed = new EmbedBuilder();
            if (userAccounts.has(interaction.user.id)) {
                signupEmbed.setTitle('You already have an account');
                await interaction.editReply({ embeds: [signupEmbed], ephemeral: true });
                return;
            }

            Web3Manager.setProviderForUser(interaction.user.id);
            const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
            const { userAccount, seedphrase } = web3Provider.createAccount();

            userAccounts.set(interaction.user.id, userAccount);
            web3Provider.setCurrentAccount(interaction.user.id);

            const seedphraseFile = new AttachmentBuilder(Buffer.from(seedphrase), { name: 'RecoveryPhrase.txt' });
            signupEmbed.setTitle('Signup Success')
                .setDescription(descriptions.SIGNUP_MESSAGE);

            await interaction.editReply({
                embeds: [signupEmbed],
                files: [seedphraseFile],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error in handleSignUp:', error);
            await interaction.editReply({ content: 'An error occurred during the signup process', ephemeral: true });
        }
    }

    async handleLogIn(interaction) {
        const loginEmbed = new EmbedBuilder();
        if (userAccounts.has(interaction.user.id)) {
            loginEmbed.setTitle('You are already logged in');
            await interaction.reply({ embeds: [loginEmbed], ephemeral: true });
            return;
        }

        const modal = new ModalBuilder()
            .setCustomId('login-modal')
            .setTitle('Enter Recovery Phrase')
            .addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('recovery-phrase')
                        .setLabel('Recovery Phrase')
                        .setStyle(TextInputStyle.Short)
                )
            );

        await interaction.showModal(modal);
    }

    async handleModalSubmit(interaction) {
        const seedphrase = interaction.fields.getTextInputValue('recovery-phrase');
        await interaction.deferReply({ ephemeral: true });

        if (userAccounts.has(interaction.user.id)) {
            loginEmbed.setTitle('You are already logged in');
            await interaction.editReply({ embeds: [loginEmbed], ephemeral: true });
            return;
        }

        try {
            Web3Manager.setProviderForUser(interaction.user.id);
            const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
            const { wallet } = await web3Provider.processSeedphrase(seedphrase);
            console.log(wallet.address);
            if (wallet) {
                userAccounts.set(interaction.user.id, wallet);
                web3Provider.setCurrentAccount(interaction.user.id);
                let loginEmbed = new EmbedBuilder();
                loginEmbed = new EmbedBuilder()
                    .setTitle('Login Success')
                    .setDescription(descriptions.SIGNUP_MESSAGE);

                await interaction.editReply({ embeds: [loginEmbed], ephemeral: true });
            }
        } catch (error) {
            console.error('Error in handleModalSubmit:', error);
            await interaction.editReply({ content: 'An error occurred during the login process', ephemeral: true });
        }
    }

    async handleLogOut(interaction) {
        try {
            if (!userAccounts.has(interaction.user.id)) {
                logoutEmbed.setTitle('You are not logged in');
                await interaction.reply({ embeds: [logoutEmbed], ephemeral: true });
                return;
            }

            userAccounts.delete(interaction.user.id);
            Web3Manager.removeProviderForUser(interaction.user.id);

            let logoutEmbed = new EmbedBuilder();
            logoutEmbed = new EmbedBuilder()
                .setTitle('You have logged out');

            await interaction.reply({ embeds: [logoutEmbed], ephemeral: true });
        } catch (error) {
            console.error('Error in handleLogOut:', error);
            await interaction.reply({ content: 'An error occurred during the logout process', ephemeral: true });
        }
    }
}

export default AccountManagementView;