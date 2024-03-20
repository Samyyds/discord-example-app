import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { LocationRepository } from '../data/repository_location.js';
import { InventoryRepository } from '../data/repository_inventory.js';
import { Item, ItemRepository } from '../data/repository_item.js';

const oreTierThreshold = 10;

const mineCommand = async (interaction) => {
    try {
        const oreName = interaction.options.getString('ore').trim();

        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;
        
        const locationRepo = LocationRepository.getInstance();
        const { regionId, roomId } = locationRepo.getLocation(interaction.user.id, activeCharId);
        
        const itemRepo = ItemRepository.getInstance();
        const oreItem = itemRepo.getItemByName(regionId, roomId, oreName);

        if (!oreItem || oreItem.type !== 'Ore' || !oreItem.details || oreItem.details.level === undefined) {
            throw new Error(`No ore named ${oreName} found or it does not have a valid level.`);
        }
        
        const miningLevel = activeCharacter.skills.mining.level;
        const oreLevel = oreItem.details.level;
        if (miningLevel < oreLevel * oreTierThreshold - (oreTierThreshold - 1)) {
            throw new Error(`Your mining skill is not high enough to mine ${oreName}.`);
        }

        let quality = oreLevel;
        let quantity = (((quality % oreTierThreshold) * 20) / 100) + 1;
        quality /= oreTierThreshold;

        activeCharacter.skills.increaseMiningXp(5);
        itemRepo.removeItemFromLocation(regionId, roomId, oreItem);

        const inventoryRepo = InventoryRepository.getInstance();
        const transformedData = { ...oreItem.transformed, quantity: Math.round(quantity) };
        const newItem = new Item(transformedData.id, transformedData.name, 'Raw Ingredient');

        if(newItem){
            inventoryRepo.addItem(interaction.user.id, activeCharId, newItem, transformedData.quantity);
            const embed = new EmbedBuilder().setDescription(`You successfully mined ${transformedData.quantity} ${newItem.name}. Your mining skill has increased.`);
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }else {
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