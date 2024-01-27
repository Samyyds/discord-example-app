import { EmbedBuilder } from 'discord.js';
import { LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';
import { getRegionNameFromId } from '../data/enums.js';
import Web3Manager from '../web3/web3_manager.js';
import descriptions from '../data/consts.js';

const mapCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);
        const result = await web3Provider.queryContract('Locations', 'getCharacterLocation', [web3Provider.toBigN(activeCharId)]);
        const regionName = getRegionNameFromId(web3Provider.toNumber(result[0]));

        let updatedMapString = descriptions.MAP_STRING;
        const regionRegex = new RegExp(`(${regionName})(\\s|\\|)`, 'g');
        updatedMapString = updatedMapString.replace(regionRegex, (match, p1, p2) => p1 + '*' + p2.slice(1));

        let embed = new EmbedBuilder()
            .setTitle('Discover Your Adventure!')
            .setDescription("```\n" + updatedMapString + "\n```")

        await interaction.editReply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in mapCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const mapCommands = {
    map: mapCommand
}