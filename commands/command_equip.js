import { EmbedBuilder } from 'discord.js';
import { Items } from "../data/enums.js";
import { getItemDataById } from '../util/util.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryRepository } from '../data/repository_inventory.js';

const equipCommand = async (interaction) => {
    try {
        const object = interaction.options.getString('object').trim().toUpperCase();

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        if (activeCharacter.isEquipped(Items[object])) {
            throw new Error('The equipment is already equipped!');
        }

        const itemData = getItemDataById(Items[object]);
        if (itemData.type.toUpperCase() != "EQUIPMENT") {
            throw new Error('Only equipment can be equipped!');
        }

        const inventoryRepo = InventoryRepository.getInstance();
        if (!inventoryRepo.hasItem(interaction.user.id, activeCharacter.id, Items[object])) {
            throw new Error('No equipment in your inventory!');
        }

        const { item: equippedItem, quantity } = inventoryRepo.getItem(interaction.user.id, activeCharacter.id, Items[object]);
        activeCharacter.equipItem(equippedItem);
        inventoryRepo.removeItem(interaction.user.id, activeCharacter.id, equippedItem, 1);

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