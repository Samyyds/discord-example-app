import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { Item } from '../data/enums.js';
import { getItemDataById } from '../util/util.js';
import { RegionManager } from '../manager/region_manager.js';


const mineCommand = async (interaction) => {
    try {
        const nodeName = interaction.options.getString('node').trim();

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const nodes = room.getNodes();
        const node = nodes.find(node => node.name.toLowerCase() === nodeName.toLowerCase());

        if (!node) {
            throw new Error(`No node named ${nodeName} found in your current location.`);
        }

        if (activeCharacter.skills[node.requiredSkillType].level < node.requiredSkillValue) {
            throw new Error(`Your ${node.requiredSkillType} skill is not high enough to harvest ${nodeName}. Required level: ${node.requiredSkillValue}`);
        }

        if (node.requiredItem && !activeCharacter.inventory.includes(node.requiredItem)) {
            throw new Error(`You do not have the required item: ${node.requiredItem} to mine ${nodeName}.`);
        }

        activeCharacter.skills.increaseSkillXp('mining', 30);

        if (newItem) {
            const inventoryManager = InventoryManager.getInstance();
            inventoryManager.addItem(interaction.user.id, activeCharId, newItem, Math.round(quantity));
            let embed = new EmbedBuilder().setDescription(`You successfully mined ${Math.round(quantity)} ${newItem.name}. Your mining skill has increased.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            throw new Error("Failed to create a new item.");
        }

    } catch (error) {
        console.error('Error in mineCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const mineCommands = {
    mine: mineCommand
}