import { EmbedBuilder } from 'discord.js';
import { Equipments, getItemTypeAndId } from "../data/enums.js";
import { InventoryManager } from "../manager/inventory_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";

const unequipCommand = async (interaction) => {
    try {
        const object = interaction.options.getString('object').trim().toUpperCase();
        const itemInfo = getItemTypeAndId(object);

        if (!itemInfo) {
            return await sendErrorMessage(interaction, 'Invalid item!');
        }

        const itemManager = ItemManager.getInstance();
        const item = itemManager.getEquipmentDataById(itemInfo.id);

        if (!item) {
            return await sendErrorMessage(interaction, 'Item does not exist!');
        }

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        if (!activeCharacter.isEquipped(item.id)) {
            return await sendErrorMessage(interaction, 'No such equipment is equipped!');
        }

        const slot = itemManager.getEquipmentDataById(itemInfo.id).slot;
        const unequippedItem = activeCharacter.unequipItem(slot);

        const inventoryManager = InventoryManager.getInstance();
        inventoryManager.addItem(interaction.user.id, activeCharacter.id, unequippedItem, 1);

        const newItem = inventoryManager.getItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id);

        let embed = new EmbedBuilder().setDescription(`You unequipped ${newItem.name.toLowerCase()}.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in unequipCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const unequipCommands = {
    unequip: unequipCommand
}