import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from "../manager/inventory_manager.js";
import { ItemType } from '../data/enums.js';

export async function handleSellAutocomplete(interaction) {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeCharacter) {
            return await interaction.respond([]);
        }

        const inventoryManager = InventoryManager.getInstance();
        const inventory = inventoryManager.getInventory(interaction.user.id, activeCharacter.id);
        
        const itemsByType = inventory.getItemsGroupedByType();

        const options = [];
        for (const [type, items] of Object.entries(itemsByType)) {
            if (parseInt(type) === ItemType.KEY) continue; 
            items.forEach(({ item, quantity }) => {
                if (quantity > 0) {
                    options.push({
                        name: `${item.name} (${quantity})`,
                        value: JSON.stringify({ itemType: parseInt(type), itemId: item.id }),
                    });
                }
            });
        }

        await interaction.respond(options.slice(0, 25));
    } catch (error) {
        console.error('Error in sell autocomplete:', error);
        await interaction.respond([]);
    }
}
