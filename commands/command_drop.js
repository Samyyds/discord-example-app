import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { InventoryRepository } from '../data/repository_inventory.js';
import { LocationRepository } from '../data/repository_location.js';
import { ItemRepository } from '../data/repository_item.js';
import { Items } from "../data/enums.js";

const dropCommand = async (interaction) => {
    try {
        const object = interaction.options.getString('object').trim().toUpperCase();
        if (!object in Items) {
            throw new Error('Invalid item!');
        }

        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const inventoryRepo = InventoryRepository.getInstance();
        if (!inventoryRepo.hasItem(interaction.user.id, activeCharId, Items[object])) {
            throw new Error('No such item in your inventory!');
        }
        const { item, quantity } = inventoryRepo.getItem(interaction.user.id, activeCharId, Items[object]);
        inventoryRepo.removeItem(interaction.user.id, activeCharId, item, 1);

        const itemRepo = ItemRepository.getInstance();
        const itemData = itemRepo.getItemDataById(Items[object]);
        const itemInstance = itemRepo.createItem(itemData);

        const locationRepo = LocationRepository.getInstance();
        const { regionId, roomId } = locationRepo.getLocation(interaction.user.id, activeCharId);
        itemRepo.addItemToLocation(regionId, roomId, itemInstance, 1);

        let embed = new EmbedBuilder().setDescription(`You drop ${object.toLowerCase()} onto the floor.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in dropCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const dropCommands = {
    drop: dropCommand
};