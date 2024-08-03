import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';

const inventoryCommand = async (interaction) => {
    try {
        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }
        const activeCharId = activeCharacter.id;

        const inventoryManager = InventoryManager.getInstance();
        const inventory = inventoryManager.getInventory(interaction.user.id, activeCharId);
        const groupedItems = inventory.getItemsGroupedByType();

        let description = groupedItems['Equipment'].length > 0
            ? groupedItems['Equipment'].map(item => `${item.name} x${item.quantity}`).join('\n')
            : 'No equipment items in your inventory.';

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('inventory_equipment')
                    .setLabel('Equipment')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('inventory_consumable')
                    .setLabel('Consumable')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('inventory_material')
                    .setLabel('Material')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('inventory_quest')
                    .setLabel('Quest')
                    .setStyle(ButtonStyle.Danger),
            );

        let embed = new EmbedBuilder().setDescription(description);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    } catch (error) {
        console.error('Error in inventoryCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const inventoryCommands = {
    inventory: inventoryCommand
}
