import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { InventoryRepository } from '../data/repository_inventory.js';

export async function handleInventoryInteraction(interaction) {
    if (!interaction.isButton()) return false;

    const userId = interaction.user.id;
    const characterRepo = CharacterRepository.getInstance();
    const activeCharacter = characterRepo.getActiveCharacter(userId);
    if (!activeCharacter) {
        await interaction.reply({ content: "You do not have an available character!", ephemeral: true });
        return true;
    }

    const activeCharId = activeCharacter.id;
    const inventoryRepo = InventoryRepository.getInstance();
    const inventory = inventoryRepo.getInventory(userId, activeCharId);
    const groupedItems = inventory.getItemsGroupedByType();

    let description = '';

    switch (interaction.customId) {
        case 'Equipment':
            description = groupedItems['Equipment'].length > 0
                ? groupedItems['Equipment'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No equipment items in your inventory.';
            break;
        case 'Gem':
            description = groupedItems['Gem'].length > 0
                ? groupedItems['Gem'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No gem items in your inventory.';
            break;
        case 'Potion':
            description = groupedItems['Potion'].length > 0
                ? groupedItems['Potion'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No potion items in your inventory.';
            break;
        case 'Raw Ingredient':
            description = groupedItems['Raw Ingredient'].length > 0
                ? groupedItems['Raw Ingredient'].map(item => `${item.name} x${item.quantity}`).join('\n')
                : 'No raw ingredient items in your inventory.';
            break;
    }

    let embed = new EmbedBuilder().setDescription(description);
    await interaction.update({ embeds: [embed] });
    return true;
}

