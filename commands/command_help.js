import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import descriptions from '../data/consts.js';
import { sendErrorMessage } from "../util/util.js";

const helpCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        let embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setDescription(descriptions.HELP_STRING);

    await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in helpCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const helpCommands = {
    help: helpCommand
}