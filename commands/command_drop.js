import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { RegionManager } from "../manager/region_manager.js";
import { Item, getItemTypeAndId } from "../data/enums.js";
import { sendErrorMessage } from "../util/util.js";

const dropCommand = async (interaction) => {
    try {
        const objectName = interaction.options.getString('object').trim().toUpperCase();

        const itemInfo = getItemTypeAndId(objectName);
        if (!itemInfo) {
            return await sendErrorMessage(interaction, 'Invalid item!');
        }

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const inventoryManager = InventoryManager.getInstance();
        if (!inventoryManager.hasItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id)) {
            return await sendErrorMessage(interaction, 'No such item in your inventory!');
        }

        const item = inventoryManager.getItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id);
        inventoryManager.removeItem(interaction.user.id, activeCharacter.id, item, 1);
      
        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharId);

        const regionManager = RegionManager.getInstance();
        const currentRegion = regionManager.getRegionById(regionId);
        const currentLocation = currentRegion.getLocation(locationId);
        const currentRoom = currentLocation.getRoom(roomId);

        currentRoom.addItemToRoom(item);

        let embed = new EmbedBuilder().setDescription(`You drop a ${item.name} onto the floor.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in dropCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const dropCommands = {
    drop: dropCommand
};