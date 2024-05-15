import { addCharacterInfoToEmbed } from '../util/util.js';
import { CharacterRepository } from '../data/repository_character.js';
import { EmbedBuilder } from 'discord.js';

export async function handleCharacterInteraction(interaction) {
    if (!interaction.isButton()) return false;

    const charRepo = CharacterRepository.getInstance();
    const activeChar = charRepo.getActiveCharacter(interaction.user.id);

    if (!activeChar) {
        await interaction.reply({ content: 'No active character found.', ephemeral: true });
        return;
    }

    let embed = new EmbedBuilder();
    let infoType = '';

    switch (interaction.customId) {
        case 'show_basic_info':
            infoType = 'basic';
            break;
        case 'show_stats':
            infoType = 'stats';
            break;
        case 'show_skills':
            infoType = 'skills';
            break;
    }

    embed = addCharacterInfoToEmbed(activeChar, embed, infoType);
    await interaction.update({ embeds: [embed], components: [interaction.message.components[0]], ephemeral: true });
}
