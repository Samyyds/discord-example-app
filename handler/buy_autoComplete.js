import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

export async function handleBuyAutocomplete(interaction) {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeCharacter) {
            return await interaction.respond([]);
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
    
        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const shops = room.getShops();
        if (!shops || shops.length === 0) {
            return await interaction.respond([]);
        }
        const itemsList = shops[0].getItemsList();

        const formattedItems = itemsList.map(item => ({
            name: `${item.itemName}.......${item.price} gold`,
            value: JSON.stringify({ itemType: item.itemType, itemId: item.itemId, itemPrice: item.price })
        }));

        await interaction.respond(formattedItems);
    
    } catch (error) {
        console.error('Error in buy autocomplete:', error);
        await interaction.respond([]);
    }
}