import { EmbedBuilder } from 'discord.js';
import { sendErrorMessage } from "../util/util.js";
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

const sellCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const shops = room.getShops();
        if (shops.length <= 0) {
            return await sendErrorMessage(interaction, 'There\s no shop nearby!');
        }

        const selectedItem = interaction.options.getString('object');
        const { itemType, itemId } = JSON.parse(selectedItem);

        const inventoryManager = InventoryManager.getInstance();

        if (!inventoryManager.hasItem(interaction.user.id, activeCharacter.id, itemType, itemId)) {
            return await sendErrorMessage(interaction, 'You do not own this item.');
        }

        const item = inventoryManager.getItem(interaction.user.id, activeCharacter.id, itemType, itemId);

        if (!item) {
            return await sendErrorMessage(interaction, 'The item could not be found in your inventory.');
        }

        inventoryManager.removeItem(interaction.user.id, activeCharacter.id, item, 1);

        activeCharacter.gold += 3;

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setDescription(`You sold **${item.name}** for **3 gold**.`);
        await interaction.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in sellCommand:', error);
        await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
}

export const sellCommands = {
    sell: sellCommand
};