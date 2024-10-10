import { EmbedBuilder } from 'discord.js';
import { Equipments, getItemTypeAndId, ItemType, Slots } from "../data/enums.js";
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { sendErrorMessage } from "../util/util.js";

const equipCommand = async (interaction) => {
    try {
        const object = interaction.options.getString('object').trim().toUpperCase();

        const itemInfo = getItemTypeAndId(object);

        if (!itemInfo) {
            return await sendErrorMessage(interaction, 'Invalid item!');
        }

        if (itemInfo.type !== ItemType.EQUIPMENT) {
            return await sendErrorMessage(interaction, ' Only weapons armors can be equipped!');
        }

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        if (activeCharacter.isEquipped(Equipments[itemInfo.id])) {
            return await sendErrorMessage(interaction, 'The equipment is already equipped!');
        }

        const inventoryManager = InventoryManager.getInstance();
        if (!inventoryManager.hasItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id)) {
            return await sendErrorMessage(interaction, 'No equipment in your inventory!');
        }

        const itemToEquip = inventoryManager.getItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id);

        if (!Object.values(Slots).includes(itemToEquip.slot)) {
            return await sendErrorMessage(interaction, 'Invalid item slot.');
        }

        if (itemToEquip.slot === Slots.MAIN_HAND && itemToEquip.isTwoHanded === 1) {
            activeCharacter.unequipItem(Slots.OFF_HAND);
        }
        if (itemToEquip.slot === Slots.OFF_HAND && activeCharacter.equippedItems[Slots.MAIN_HAND] && activeCharacter.equippedItems[Slots.MAIN_HAND].isTwoHanded === 1) {
            return await sendErrorMessage(interaction, 'Cannot equip off-hand item while wielding a two-handed weapon.');
        }

        const currentEquippedItem = activeCharacter.unequipItem(itemToEquip.slot);
        if (currentEquippedItem) {
            inventoryManager.addItem(interaction.user.id, activeCharacter.id, currentEquippedItem, 1);
        }

        activeCharacter.equipItem(itemToEquip);
        inventoryManager.removeItem(interaction.user.id, activeCharacter.id, itemToEquip, 1);

        let embed = new EmbedBuilder().setDescription(`You equipped ${object.toLowerCase()}.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in equipCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const equipCommands = {
    equip: equipCommand
}