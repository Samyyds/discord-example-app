import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from "../manager/region_manager.js";
import { sendErrorMessage } from "../util/util.js";

const lookCommand = async (interaction) => {
    try {
        const objectName = interaction.options.getString('object');

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharId);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            return await sendErrorMessage(interaction, `Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }
        const enemies = room.getEnemies();
        const nodes = room.getNodes();
        const items = room.getItems();

        let description = '';

        if (roomId === 0) {
            const location = regionManager.getLocationById(regionId, locationId);
            description += location.description ? `${location.description}\n\n` : '';
        } else {
            description += room.description ? `${room.description}\n\n` : '';
        }

        if (objectName) {
            const enemy = enemies.find(enemy => enemy.name.toLowerCase() === objectName.toLowerCase());
            const node = nodes.find(node => node.name.toLowerCase() === objectName.toLowerCase());
            const item = items.find(item => item.name.toLowerCase() === objectName.toLowerCase());
            if (enemy) {
                description += `${enemy.description}\n`;
            } else if (node) {
                description += `${node.description}\n`;
            } else if (item) {
                description += `${item.description}\n`;
            } else {
                description = `No '${objectName}' found.`;
            }
        } else {
            if (enemies.length) {
                description += '**Enemies in the room:**\n';
                description += enemies.map(enemy => `${enemy.name}`).join(', ') + '\n\n';
            }

            if (nodes.length) {
                description += '**Nodes in the room:**\n';
                description += nodes.map(node => `${node.name}`).join(', ') + '\n';
            }

            if (items.length) {
                const itemCounts = items.reduce((counts, item) => {
                    counts[item.id] = (counts[item.id] || 0) + 1;
                    return counts;
                }, {});

                description += '\n**Items in the room:**\n';
                for (const [itemId, count] of Object.entries(itemCounts)) {
                    const item = items.find(i => i.id === parseInt(itemId));
                    description += `${item.name} (x${count})\n`;
                }
            }
        }
        
        let embed = new EmbedBuilder();
        if (description.trim().length > 0) {
            embed.setDescription(description);
        } else {
            embed.setDescription('There is nothing to see here.');
        }
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
