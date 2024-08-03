import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { ItemType } from "../data/enums.js";

export async function handleInventoryInteraction(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const characterRepo = CharacterManager.getInstance();
    const activeCharacter = characterRepo.getActiveCharacter(userId);
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
    if (itemsInCategory && itemsInCategory.length > 0) {
        description = itemsInCategory.map(item => `${item.name} x${item.quantity}`).join('\n');
    }

    let embed = new EmbedBuilder()
        .setTitle(`You have:`)
        .setDescription(description);

    await interaction.update({ embeds: [embed] });
}
