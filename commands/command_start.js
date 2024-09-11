import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Tutorial, TutorialManager } from "../manager/tutorial_manager.js";

const startCommand = async (interaction, client) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        if (interaction.channelId === process.env.FREE_ACCESS_CHANNEL) {
            const member = await interaction.guild.members.fetch(interaction.user.id);
            await member.roles.add(process.env.FREE_MEMBER_ROLE);

            const updatedMember = await interaction.guild.members.fetch(interaction.user.id);
            if (updatedMember.roles.cache.has(process.env.FREE_MEMBER_ROLE)) {
                const tutorialManager = TutorialManager.getInstance();
                tutorialManager.startTutorialForUser(interaction, client);
            }
        }
    } catch (error) {
        console.error('Error in startCommand:', error);
        await interaction.followUp({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const startCommands = {
    start: startCommand
};