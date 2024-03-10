import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationRepository } from '../data/repository_location.js';
import rooms from '../json/rooms.json' assert { type: 'json' };

const lookCommand = async (interaction) => {
    try {
        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const locationRepo = LocationRepository.getInstance();
        const { regionId, roomId } = locationRepo.getLocation(interaction.user.id, activeCharId);
        console.log(`region: ${regionId}, room: ${roomId}`);
        const description = getRoomDescriptionById(regionId, roomId) || 'You find yourself in an unremarkable location.';

        let embed = new EmbedBuilder().setDescription(description);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    }

    catch (error) {
        console.error('Error in inspectCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

function getRoomDescriptionById(regionId, roomId) {
    const room = rooms.find(room => room.regionId === regionId && room.roomId === roomId);
    return room ? room.description : null;
}

export const lookCommands = {
    look: lookCommand
};