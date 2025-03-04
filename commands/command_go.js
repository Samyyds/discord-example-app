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

        if (!destination) {
            return await sendErrorMessage(interaction, 'You must select a destination to go!');
        }

        const currentRegion = regionManager.getRegionById(curLocation.regionId);
        const currentLocation = currentRegion.getLocation(curLocation.locationId);
        const currentRoom = currentLocation.getRoom(curLocation.roomId);

        const enemies = currentRoom.getEnemies();

        const playerHasLockedEnemy = enemies.some(enemy => enemy.isTarget.has(activeCharacter.id));

        const allEnemiesLockedByOthers = enemies.every(enemy => enemy.isTarget.size > 0);

        if (destination === 'dungeon-in') {
            if (playerHasLockedEnemy) {
                return await sendErrorMessage(interaction, `Enemies still block the way ahead. Clear them out to continue!`);
            } else if (!playerHasLockedEnemy && allEnemiesLockedByOthers) {
                playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, false);
            } else {
                return await sendErrorMessage(interaction, `Enemies still block the way ahead. Clear them out to continue!`);
            }
        } else if (destination === 'dungeon-out') {
            playerMoveManager.moveRoom(interaction.user.id, activeCharacter.id, true);
        } else {
            const [regionPart, locationPart] = destination.split('-');
            const targetLocationId = parseInt(locationPart, 10);
            playerMoveManager.moveLocation(interaction.user.id, activeCharacter.id, curLocation.regionId, targetLocationId);
        }

        const newLocation = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        saveCharacterLocation(interaction.user.id, activeCharacter.id, newLocation);

        const newRegion = regionManager.getRegionById(newLocation.regionId);
        const newLoc = newRegion.getLocation(newLocation.locationId);

        let description;

        if (newLoc.roomCount > 1) {
            const roomId = newLocation.roomId;
            const roomCount = newLoc.roomCount;

            if (roomId === 0) {
                description = `You are at the **entrance** of ${newLoc.name}.`;
            } else if (roomId === roomCount - 1) {
                description = `You have reached the **bottom** of ${newLoc.name}.`;
            } else {
                description = `You are **${roomId} mile(s)** away from the entrance of ${newLoc.name}.`;
            }
        } else {
            description = newLoc.enterDescription;
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
