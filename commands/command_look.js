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
        const nodes = room.getNodes();

        let description = '';

        if (objectName) {
            const enemy = enemies.find(enemy => enemy.name.toLowerCase() === objectName.toLowerCase());
            const node = nodes.find(node => node.name.toLowerCase() === objectName.toLowerCase());
            if (enemy) {
                description += `${enemy.description}\n`;
            } else if (node) {
                description += `${node.description}\n`;
            } else {
                description = `No '${objectName}' found.`;
            }
        } else {
            description += room.description ? `${room.description}\n\n` : '';
            description += enemies.length ? '**Enemies in the room:**\n' + enemies.map(enemy => `${enemy.name}`).join(', ') + '\n\n' : 'No enemies present.\n\n';
            description += nodes.length ? '**Nodes in the room:**\n' + nodes.map(node => `${node.name}`).join(', ') + '\n' : 'No nodes present.';
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