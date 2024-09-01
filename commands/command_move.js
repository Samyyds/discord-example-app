import { EmbedBuilder } from 'discord.js';
import { RegionManager } from '../manager/region_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { CharacterManager } from '../manager/character_manager.js';
import { saveCharacterLocation } from "../db/mysql.js";
import { sendErrorMessage } from "../util/util.js";

const moveCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const curLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const currentRegion = regionManager.getRegionById(curLocation.regionId);
        const currentLocation = currentRegion.getLocation(curLocation.locationId);
        const currentRoom = currentLocation.getRoom(curLocation.roomId);

        const isValidRoom = currentLocation.roomCount > 1;

        if (!isValidRoom) {
            return await sendErrorMessage(interaction, 'There are no additional rooms to explore in your current location!');
        }

        console.log(`currentRoom.hasEnemies: ${currentRoom.hasEnemies()}`);
        // if (currentRoom.hasEnemies()) {
        //     throw new Error('You cannot move to another room while there are still enemies here!');
        // }实际测试时要打开！

        const direction = interaction.options.getInteger('direction');
        let moved = false;

        if (direction === 0) { // Down
            const canMoveDown = playerMoveManager.canMoveDown(interaction.user.id, activeCharacter.id);
            if (!canMoveDown) {
                return await sendErrorMessage(interaction, 'You\'ve reached the last room. There\'s no way to move down!');
            }
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, false);
            moved = true;
        } else if (direction === 1) { // Up
            const canMoveUp = playerMoveManager.canMoveUp(interaction.user.id, activeCharacter.id);
            if (!canMoveUp) {
                return await sendErrorMessage(interaction, 'You are already in the first room. There\'s no way to move up!');
            }
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, true);
            moved = true;
        }

        if (moved) {
            const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
            const locationName = regionManager.getLocationById(newLocation.regionId, newLocation.locationId).name;

            let distanceDescription;
            if (newLocation.roomId === 0) {
                distanceDescription = `You are now back at ${locationName}!`;
            } else {
                distanceDescription = `You are now ${newLocation.roomId} miles away from ${locationName}.`;
            }

            saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

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
