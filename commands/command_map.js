import { EmbedBuilder } from 'discord.js';
import { LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';
import { getRegionNameFromId } from '../data/enums.js';
import descriptions from '../data/consts.js';

const mapCommand = async (interaction) => {
    try {
        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const locationRepo = LocationRepository.getInstance();
        const {regionId,} = locationRepo.getLocation(interaction.user.id, activeCharId) || {};
       
        const regionName = getRegionNameFromId(regionId);

        let updatedMapString = descriptions.MAP_STRING;
        const regionRegex = new RegExp(`(${regionName})(\\s|\\|)`, 'g');
        updatedMapString = updatedMapString.replace(regionRegex, (match, p1, p2) => p1 + '*' + p2.slice(1));

        let embed = new EmbedBuilder()
            .setTitle('Discover Your Adventure!')
            .setDescription("```\n" + updatedMapString + "\n```")

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in mapCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const mapCommands = {
    map: mapCommand
}