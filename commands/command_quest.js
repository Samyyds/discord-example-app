import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { sendErrorMessage } from "../util/util.js";
import { CharacterManager } from '../manager/character_manager.js';

const questCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const components = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('quest_show_in_progress')
                .setLabel('In Progress')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('quest_show_completed')
                .setLabel('Completed')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId('quest_show_turned_in')
                .setLabel('Turned In')
                .setStyle(ButtonStyle.Secondary)
        );

    const embed = new EmbedBuilder()
        .setTitle('Your Quests')
        .setDescription('Select a category to view your quests.')
        .setColor(0x00FF00);

    await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });

    } catch (error) {
        console.error('Error in questCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const questCommands = {
    quest: questCommand
};