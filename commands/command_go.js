import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from '../manager/region_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { sendErrorMessage } from "../util/util.js";
import { saveCharacterLocation } from "../db/mysql.js";
import { EmbedBuilder } from 'discord.js';

const goCommand = async (interaction) => {
    try {
        const playerMoveManager = PlayerMovementManager.getInstance();
        const regionManager = RegionManager.getInstance();
        const characterManager = CharacterManager.getInstance();

        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an active character!');
        }

        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        const destination = interaction.options.getString('destination');

        if (destination === 'dungeon-in') {
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, false);
        } else if (destination === 'dungeon-out') {
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, true);
        } else {
            const [regionPart, locationPart] = destination.split('-');
            const targetLocationId = parseInt(locationPart, 10);
            playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, curLocation.regionId, targetLocationId);
        }

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const currentRegion = regionManager.getRegionById(newLocation.regionId);
        const currentLocation = currentRegion.getLocation(newLocation.locationId);

        let description;

        if (currentLocation.roomCount > 1) {
            const roomId = newLocation.roomId;
            const roomCount = currentLocation.roomCount;

            if (roomId === 0) {
                description = `You are at the **entrance** of ${currentLocation.name}.`;
            } else if (roomId === roomCount - 1) {
                description = `You have reached the **bottom** of ${currentLocation.name}.`;
            } else {
                description = `You are **${roomId} mile(s)** away from the entrance of ${currentLocation.name}.`;
            }
        } else {
            description = currentLocation.enterDescription;
        }

        const embed = new EmbedBuilder()
            .setDescription(description)
            .setColor(0x00FF00);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
        console.error('Error in goCommand:', error);
        return await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
};

export const goCommands = {
    go: goCommand,
};
