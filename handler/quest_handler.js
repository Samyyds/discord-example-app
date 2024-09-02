import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { QuestManager } from '../manager/quest_manager.js';
import { QuestStatus } from "../data/enums.js";

export async function handleQuestInteraction(interaction) {
    if (!interaction.isButton()) return;
    const activeCharacter = CharacterManager.getInstance().getActiveCharacter(interaction.user.id);
    const questManager = QuestManager.getInstance();
    const charQuests = questManager.getCharQuests(interaction.user.id, activeCharacter.id);

    let filteredQuests;
    let title;

    switch (interaction.customId) {
        case 'quest_show_in_progress':
            filteredQuests = charQuests.filter(q => q.status === QuestStatus.IN_PROGRESS);
            title = 'Quests In Progress';
            break;
        case 'quest_show_completed':
            filteredQuests = charQuests.filter(q => q.status === QuestStatus.COMPLETED);
            title = 'Completed Quests';
            break;
        case 'quest_show_turned_in':
            filteredQuests = charQuests.filter(q => q.status === QuestStatus.COMPLETED_AND_TURNED_IN);
            title = 'Turned In Quests';
            break;
        default:
            await interaction.reply({ content: "Unknown quest status.", ephemeral: true });
            return;
    }

    let description = filteredQuests.map(q => `${q.name}: ${q.description}`).join('\n') || 'No quests in this category.';

    let embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x00FF00);

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

    await interaction.update({ embeds: [embed], components: [components] });
}
