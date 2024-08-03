import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';

export async function handleInventoryInteraction(interaction) {
    if (!interaction.isButton()) return false;

    const userId = interaction.user.id;
    const characterRepo = CharacterManager.getInstance();
    const activeCharacter = characterRepo.getActiveCharacter(userId);
    if (!activeCharacter) {
        await interaction.reply({ content: "You do not have an available character!", ephemeral: true });
        return true;
    }

    const activeCharId = activeCharacter.id;
    const inventoryManager = InventoryManager.getInstance();
    const inventory = inventoryManager.getInventory(userId, activeCharId);
    const groupedItems = inventory.getItemsGroupedByType();

    let description = '';

    switch (interaction.customId) {
        case 'inventory_equipment':
            description = groupedItems['Equipment'].length > 0
                ? groupedItems['Equipment'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No equipment items in your inventory.';
            break;
        case 'inventory_consumable':
            description = groupedItems['Consumable'].length > 0
                ? groupedItems['Consumable'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No consumable items in your inventory.';
            break;
        case 'inventory_material':
            description = groupedItems['Material'].length > 0
                ? groupedItems['Material'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No material items in your inventory.';
            break;
        case 'inventory_quest':
            description = groupedItems['Quest'].length > 0
                ? groupedItems['Quest'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No quest items in your inventory.';
            break;
    }

    let embed = new EmbedBuilder().setDescription(description);
    await interaction.update({ embeds: [embed] });
    return true;
}

