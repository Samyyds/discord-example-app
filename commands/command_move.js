import { EmbedBuilder } from 'discord.js';
import { RegionsData, LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';

const moveCommand = async (interaction) => {
    try {
        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        const locationRepo = LocationRepository.getInstance();
        const curLocation = locationRepo.getLocation(interaction.user.id, activeCharacter.id);
        const isValidRoom = RegionsData.isValidRoom(curLocation.regionId, curLocation.locationId);

        if (!isValidRoom) {
            throw new Error('There are no additional rooms to explore in your current location!');
        }

        const direction = interaction.options.getInteger('direction');
        let moved = false;

        if (direction === 0) {//Down
            const canMoveDown = locationRepo.canMoveDown(interaction.user.id, activeCharacter.id);
            if (!canMoveDown) {
                throw new Error('You\'ve reached the last room. There\'s no way to move down!');
            }
            locationRepo.moveRoom(interaction.user.id, activeCharacter.id, false);
            moved = true;
        } else if (direction === 1) {//Up
            const canMoveUp = locationRepo.canMoveUp(interaction.user.id, activeCharacter.id);
            if (!canMoveUp) {
                throw new Error('You are already in the first room. There\'s no way to move up!');
            }
            locationRepo.moveRoom(interaction.user.id, activeCharacter.id, true);
            moved = true;
        }

        if (moved) {
            const newLocation = locationRepo.getLocation(interaction.user.id, activeCharacter.id);
            const locationName = RegionsData.getLocationById(newLocation.regionId, newLocation.locationId).name;

            let distanceDescription;
            if (newLocation.roomId === 0) {
                distanceDescription = `You are now back at ${locationName}!`;
            } else {
                distanceDescription = `You are now ${newLocation.roomId} miles away from ${locationName}.`;
            }

            let embed = new EmbedBuilder()
                .setTitle('Journey Continues!')
                .setDescription(distanceDescription);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }

    } catch (error) {
        console.error('Error in moveCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const moveCommands = {
    move: moveCommand
};
