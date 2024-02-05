import { EmbedBuilder } from 'discord.js';
import { LocationRepository } from '../data/repository_location.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationType, getLocationFromInput } from '../data/enums.js';
import Web3Manager from '../web3/web3_manager.js';

const goCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterRepository.getInstance();
        const activeCharId = characterRepo.getActiveCharacter(interaction.user.id).id;
        if (!activeCharId) {
            throw new Error('You do not have an available character!');
        }

        const regionName = interaction.options.getString('region').trim();
        const roomName = interaction.options.getString('room')?.trim() || '';

        const { regionId, roomId } = getLocationFromInput(regionName, roomName);

        const locationRepo = LocationRepository.getInstance();
        const { regionId: curRegionId, roomId: curRoomId } = locationRepo.getLocation(interaction.user.id, activeCharId);

        if (regionId === curRegionId && roomId === curRoomId) {
            let embed = new EmbedBuilder()
                .setTitle('Hold Your Horse!')
                .setDescription(`You're already at this location. Time to explore or embark on a new quest!`);
            await interaction.editReply({ embeds: [embed], ephemeral: true });
            return;
        }

        const web3Provider = Web3Manager.getProviderForUser(interaction.user.id);

        if (regionId !== curRegionId) {
            await web3Provider.sendTransaction('Locations', 'moveRegion', [web3Provider.toBigN(activeCharId), web3Provider.toBigN(regionId)]);
        }

        if (roomId !== curRoomId) {
            await web3Provider.sendTransaction('Locations', 'moveRoom', [web3Provider.toBigN(activeCharId), web3Provider.toBigN(roomId)]);
        }

        locationRepo.setLocation(interaction.user.id, activeCharId, regionId, roomId);

        let embed = new EmbedBuilder()
            .setTitle('Adventure Awaits!')
            .setDescription(`Pack your bags! You're now exploring:`)
            .addFields(
                { name: 'Region', value: String(regionName), inline: true },
                { name: 'Room', value: String(roomName), inline: true }
            );

        await interaction.editReply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in goCommand:', error);
        let errorMessage = 'An error occurred.';
        if (error.message.includes('not found')) {
            errorMessage = "Whoops! You can't venture into the unknown like that. Try picking a place that's on the map!";
        } else if (error.innerError && error.innerError.message.includes('_validateMoveRegion')) {
            errorMessage = "To embark on a journey to another region, you must first navigate back to the starting room of your current region.";
        }
        await interaction.editReply({ content: errorMessage, ephemeral: true });
    }
}

export const goCommands = {
    go: goCommand
};
