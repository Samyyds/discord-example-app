import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationRepository } from '../data/repository_location.js';
import { ItemRepository } from '../data/repository_item.js';
import { InventoryRepository } from '../data/repository_inventory.js';

const takeCommand = async (interaction) => {
    try {
        const itemName = interaction.options.getString('item').trim();

        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const locationRepo = LocationRepository.getInstance();
        const { regionId, roomId } = locationRepo.getLocation(interaction.user.id, activeCharId);

        const itemRepo = ItemRepository.getInstance();
        const itemCount = itemRepo.getItemCountByName(regionId, roomId, itemName);

        let description = '';

        if (itemCount > 0) {
            const item = itemRepo.getItemByName(regionId, roomId, itemName);
            const inventoryRepo = InventoryRepository.getInstance();
            inventoryRepo.addItem(interaction.user.id, activeCharId, item, 1);
            itemRepo.removeItemFromLocation(regionId, roomId, item.id, 1);

            description += `${item.name.toLowerCase()} added to your inventory.`;
        }
        else {
            description += "\nItem not found or not available in this location.";
        }
        let embed = new EmbedBuilder().setDescription(description);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in takeCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const takeCommands = {
    take: takeCommand
};