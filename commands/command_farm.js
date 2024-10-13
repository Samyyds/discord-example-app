import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { Skill } from '../data/enums.js';
import { RegionManager } from '../manager/region_manager.js';
import { Item, ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";

const farmCommand = async (interaction) => {
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

        if (node.requiredSkillType != Skill.FARMING) {
            return await sendErrorMessage(interaction, 'Requires farming skill.');
        }

        // if (activeCharacter.skills[node.requiredSkillType].level < node.requiredSkillValue) {
        //     throw new Error(`Your ${node.requiredSkillType} skill is not high enough to harvest ${nodeName}. Required level: ${node.requiredSkillValue}`);
        // }

        if (node.requiredItem && !activeCharacter.inventory.includes(node.requiredItem)) {
            return await sendErrorMessage(interaction, `You do not have the required item: ${node.requiredItem} to gather ${nodeName}.`);
        }

        const itemManager = ItemManager.getInstance();
        const newItem = new Item(itemManager.getItemDataById(Number(node.yieldEntry)));

        const { min, max } = itemManager.parseYieldQuantity(node.yieldQuantity);
        const quantity = Math.floor(Math.random() * (max - min + 1) + min);

        if (newItem) {
            const inventoryManager = InventoryManager.getInstance();
            inventoryManager.addItem(interaction.user.id, activeCharacter.id, newItem, Math.round(quantity));
            let embed = new EmbedBuilder().setDescription(`You successfully farmed ${Math.round(quantity)} ${newItem.name}. Your gathering skill has increased.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } else {
            return await sendErrorMessage(interaction, 'Failed to gather.');
        }

        activeCharacter.skills.increaseSkillXp('farming', node.skillXP);

    } catch (error) {
        console.error('Error in farmCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const farmCommands = {
    farm: farmCommand
}