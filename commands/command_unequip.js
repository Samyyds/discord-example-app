import { EmbedBuilder } from 'discord.js';
import { Items } from "../data/enums.js";
import { getItemDataById } from '../util/util.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryRepository } from '../data/repository_inventory.js';

const unequipCommand = async (interaction) => {
    try {
        const object = interaction.options.getString('object').trim().toUpperCase();

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        if (!activeCharacter.isEquipped(Items[object])) {
            throw new Error('No equipment to be unequipped!');
        }
        
        const slot = getItemDataById(Items[object]).slot;
        const unequippedItem = activeCharacter.unequipItem(slot);

        const inventoryRepo = InventoryRepository.getInstance();
        inventoryRepo.addItem(interaction.user.id, activeCharacter.id, unequippedItem, 1);

        const {item: newItem, quantity} = inventoryRepo.getItem(interaction.user.id, activeCharacter.id, Items[object]);

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