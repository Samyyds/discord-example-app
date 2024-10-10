import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { Item,ItemManager } from "../manager/item_manager.js";

const inventoryCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await interaction.reply({ content: 'You do not have an available character!', ephemeral: true });
        }

        const inventoryManager = InventoryManager.getInstance();
        const inventory = inventoryManager.getInventory(interaction.user.id, activeCharacter.id);
        const groupedItems = inventory.getItemsGroupedByType();

        //for test only
        const itemManager = ItemManager.getInstance();
        const cheatItem = new Item(itemManager.getItemDataById(1));
        inventoryManager.addItem(interaction.user.id, activeCharacter.id, cheatItem, 3);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('inventory_equipment').setLabel('Equipment').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('inventory_consumable').setLabel('Consumable').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('inventory_material').setLabel('Material').setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('inventory_quest').setLabel('Quest').setStyle(ButtonStyle.Danger),
            );

        let embed = new EmbedBuilder()
            .setTitle('Inventory Categories')
            .setDescription('Select a category to view items.');

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    } catch (error) {
        console.error('Error in inventoryCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const inventoryCommands = {
    inventory: inventoryCommand
};
