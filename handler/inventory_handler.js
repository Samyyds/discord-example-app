import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { ItemType, Rarity } from "../data/enums.js";

const rarityToColor = {
    [Rarity.WORN]: '[30m',       
    [Rarity.MEDIAN]: '[32m',      
    [Rarity.ENIGMATIC]: '[34m',   
    [Rarity.DELPHIC]: '[36m',     
    [Rarity.ENTHEAT]: '[35m',     
    [Rarity.HALLOWED]: '[33m',    
    [Rarity.APOCRYPHAL]: '[31m'   
};

export async function handleInventoryInteraction(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const characterManager = CharacterManager.getInstance();
    const activeCharacter = characterManager.getActiveCharacter(userId);
    if (!activeCharacter) {
        await interaction.reply({ content: "You do not have an available character!", ephemeral: true });
        return;
    }

    const inventoryManager = InventoryManager.getInstance();
    const inventory = inventoryManager.getInventory(userId, activeCharacter.id);
    const groupedItems = inventory.getItemsGroupedByType();
    const type = interaction.customId.split('_')[1].toUpperCase();
    const category = ItemType[type];
    const itemsInCategory = groupedItems[category];

    let description = 'No items in this category.';
    if (type === 'EQUIPMENT' && itemsInCategory && itemsInCategory.length > 0) {
        description = '```ansi\n';
        itemsInCategory.forEach(entry => {
            const equipment = entry.item;
            const rarityColor = getRarityColor(equipment.rarity);
            description += `${rarityColor}${equipment.name} x${entry.quantity}\u001b[0m\n`;
        });
        description += '```';
    } else if (itemsInCategory && itemsInCategory.length > 0) {
        description = itemsInCategory.map(entry => `${entry.item.name} x${entry.quantity}`).join('\n');
    }

    let embed = new EmbedBuilder()
        .setTitle(`You have:`)
        .setDescription(description);

    await interaction.update({ embeds: [embed] });
}

function getRarityColor(rarity) {
    const numericRarity = Number(rarity); 
    if (numericRarity in rarityToColor) {
        const colorCode = rarityToColor[numericRarity];
        return `\u001b${colorCode}`;
    }
    return '\u001b[30m';
}
