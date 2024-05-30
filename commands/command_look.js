import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from "../manager/region_manager.js";

const lookCommand = async (interaction) => {
    try {
        const objectName = interaction.options.getString('object');

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharId);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            throw new Error(`Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }
        const enemies = room.getEnemies();

        let description = '';

        if (objectName) {
            const enemy = enemies.find(enemy => enemy.name.toLowerCase() === objectName.toLowerCase());
            if (enemy) {
                description += enemy.description;

            } else {
                description = `${objectName} not found.`;
            }

        } else {
            if (roomId < 1) {
                const location = regionManager.getLocationById(regionId, locationId);
                description += `${location.description}\n`;
            }

            if (enemies.length > 0) {
                const enemyCounts = enemies.reduce((acc, enemy) => {
                    acc[enemy.name] = (acc[enemy.name] || 0) + 1;
                    return acc;
                }, {});

                description += 'You see the following enemies:\n';
                for (const [enemyName, count] of Object.entries(enemyCounts)) {
                    description += `${enemyName} x${count}\n`;
                }
            }
        }

        let embed = new EmbedBuilder().setDescription(description);
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    catch (error) {
        console.error('Error in lookCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const lookCommands = {
    look: lookCommand
};