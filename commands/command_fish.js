import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { Skill } from '../data/enums.js';
import { RegionManager } from '../manager/region_manager.js';
import { Fish, ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";

const fishCommand = async (interaction) => {
    try {
        const nodeName = interaction.options.getString('resource').trim();

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const nodes = room.getNodes();
        const node = nodes.find(node => node.name.toLowerCase() === nodeName.toLowerCase());

        if (!node) {
            return await sendErrorMessage(interaction, `No node named ${nodeName} found in your current location.`)
        }

        if (node.requiredSkillType != Skill.FISHING) {
            return await sendErrorMessage(interaction, 'Requires fishing skill.');
        }

        // if (activeCharacter.skills[node.requiredSkillType].level < node.requiredSkillValue) {
        //     throw new Error(`Your ${node.requiredSkillType} skill is not high enough to harvest ${nodeName}. Required level: ${node.requiredSkillValue}`);
        // }

        if (node.requiredItem && !activeCharacter.inventory.includes(node.requiredItem)) {
            return await sendErrorMessage(interaction, `You do not have the required item: ${node.requiredItem} to fish ${nodeName}.`);
        }

        const itemManager = ItemManager.getInstance();
        const yieldEntries = node.yieldEntry.split(',').map(Number);
        const randomYieldEntry = yieldEntries[Math.floor(Math.random() * yieldEntries.length)];        
        const newItem = new Fish(itemManager.getFishDataById(Number(randomYieldEntry)));
        //TODO
        const quantity = 1;

        if (newItem) {
            const inventoryManager = InventoryManager.getInstance();
            inventoryManager.addItem(interaction.user.id, activeCharacter.id, newItem, Math.round(quantity));
            let embed = new EmbedBuilder().setDescription(`You successfully fished ${Math.round(quantity)} ${newItem.name}. Your fishing skill has increased.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            return await sendErrorMessage(interaction, 'Failed to fish.');
        }

        activeCharacter.skills.increaseSkillXp('fishing', node.skillXP);

    } catch (error) {
        console.error('Error in fishCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const fishCommands = {
    fish: fishCommand
}