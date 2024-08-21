import { EmbedBuilder } from 'discord.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { PlayerMovementManager } from '../manager/player_movement_manager.js';
import { sendErrorMessage } from "../util/util.js";

const takeCommand = async (interaction) => {
    try {
        const itemName = interaction.options.getString('item').trim();

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharId);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);

        if (!room) {
            return await sendErrorMessage(interaction, `Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }

        const items = room.getItems();
        const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

        if (!item) {
            return await sendErrorMessage(interaction, `No '${itemName}' found in the room.`);
        }

        const itemCount = items.filter(i => i.id === item.id).length;
        room.removeItemFromRoom(item);

        const inventoryManager = InventoryManager.getInstance();
        inventoryManager.addItem(interaction.user.id, activeCharId, item, 1);

        let description = `You have taken ${item.name} (x1) and added it to your inventory.`;

        if (itemCount > 1) {
            description += `\n${itemCount - 1} x ${item.name} remain(s) in the room.`;
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