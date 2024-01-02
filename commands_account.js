import Web3Manager from './web3Manager.js';
import pkg from 'discord.js';
const { EmbedBuilder, AttachmentBuilder } = pkg;
import descriptions from './consts.js';

const registerCommand = async (interaction) => {
    if (interaction.commandName !== 'register') return;

    try {
        await interaction.deferReply({ ephemeral: true });
        const { mnemonic } = Web3Manager.createMnemonic();
        const seedphraseFile = new AttachmentBuilder(Buffer.from(mnemonic), { name: 'RecoveryPhrase.txt' });
        const signupEmbed = new EmbedBuilder()
            .setTitle('Signup Success')
            .setDescription(descriptions.SIGNUP_MESSAGE);

        await interaction.editReply({
            embeds: [signupEmbed],
            files: [seedphraseFile]
        });
    } catch (error) {
        console.error('Error in register command:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    }
};

export const commands = {
    register: registerCommand
};

