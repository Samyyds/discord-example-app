import { EmbedBuilder } from 'discord.js';
import { LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationType, getLocationFromInput } from '../data/enums.js';

const regionRoomLimits = {
    [LocationType.MARA.index]: Object.keys(LocationType.MARA.rooms).length,
    [LocationType.STONESIDE_DUNGEON.index]: Object.keys(LocationType.STONESIDE_DUNGEON.rooms).length,
    [LocationType.MOUNTAIN.index]: Object.keys(LocationType.MOUNTAIN.rooms).length,
    [LocationType.FOREST.index]: Object.keys(LocationType.FOREST.rooms).length,
    [LocationType.GRAVEYARD.index]: Object.keys(LocationType.GRAVEYARD.rooms).length,
    [LocationType.BEACH.index]: Object.keys(LocationType.BEACH.rooms).length,
};

const goCommand = async (interaction) => {
    try {
        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const regionName = interaction.options.getString('region').trim();
        const roomName = interaction.options.getString('room')?.trim() || '';

        const { regionId, roomId } = getLocationFromInput(regionName, roomName);

        const locationRepo = LocationRepository.getInstance();
        const currentLocation = locationRepo.getLocation(interaction.user.id, activeCharId) || {};

        if (regionId === currentLocation.regionId && roomId === currentLocation.roomId) {
            let embed = new EmbedBuilder()
                .setTitle('Hold Your Horse!')
                .setDescription(`You're already at this location. Time to explore or embark on a new quest!`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        if (regionId !== currentLocation.regionId) {
            if (!locationRepo.canMoveRegion(interaction.user.id, activeCharId, regionId)) {
                throw new Error("Cannot move to the target region from current location.");
            }
            locationRepo.moveRegion(interaction.user.id, activeCharId, regionId);
        }

        if (roomId !== currentLocation.roomId) {
            if (!locationRepo.canMoveRoom(interaction.user.id, activeCharId, roomId, regionRoomLimits)) {
                throw new Error("Cannot move to the target room from current location.");
            }
            locationRepo.moveRoom(interaction.user.id, activeCharId, roomId);
        }

        let embed = new EmbedBuilder()
            .setTitle('Adventure Awaits!')
            .setDescription(`Pack your bags! You're now exploring:`)
            .addFields(
                { name: 'Region', value: String(regionName), inline: true },
                { name: 'Room', value: String(roomName), inline: true }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in goCommand:', error);
        let errorMessage = 'An error occurred.';
        if (error.message.includes('not found')) {
            errorMessage = "Whoops! You can't venture into the unknown like that. Try picking a place that's on the map!";
        } else if (error.message.includes('Cannot move')) {
            errorMessage = error.message;
        }
        await interaction.reply({ content: errorMessage, ephemeral: true });
    }
};

export const goCommands = {
    go: goCommand
};
