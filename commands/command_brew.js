import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { ItemType } from "../data/enums.js";
import { Consumable, Item, ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";
import { RegionManager } from "../manager/region_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

const brewCommand = async (interaction) => {
    try {
        const recipeName = interaction.options.getString('recipe_name').trim();

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        const nodes = room.getNodes();
        if (!nodes.find(node => node.name.toLowerCase() === 'kitchen')) {
            return await sendErrorMessage(interaction, 'No kitchen available here. Please head to the Moku\'ah Tavern.');
        }

        const recipeManager = RecipeManager.getInstance();
        const recipe = recipeManager.getRecipeByName(recipeName);

        if (!recipeManager.hasRecipe(interaction.user.id, activeCharacter.id, recipe.id)) {
            return await sendErrorMessage(interaction, 'You do not have this recipe!');
        }

        const ingredients = recipe.ingredients;
        const missingIngredients = [];
        const inventoryManager = InventoryManager.getInstance();
        const itemManager = ItemManager.getInstance();

        const itemsToRemove = [];

        for (const ingredient of ingredients) {
            if (ingredient.item === "any_consumable") {
                let foundConsumable = false;
                const consumables = itemManager.consumableTemplates.map(c => c.id);
                for (const id of consumables) {
                    const itemQuantity = inventoryManager.getItem(interaction.user.id, activeCharacter.id, ItemType.CONSUMABLE, id);
                    if (itemQuantity && itemQuantity.quantity >= ingredient.quantity) {
                        itemsToRemove.push({ itemId: id, quantity: ingredient.quantity });
                        foundConsumable = true;
                        break;
                    }
                }
                if (!foundConsumable) {
                    missingIngredients.push(`${ingredient.quantity} x any consumable`);
                }
            } else {
                const itemQuantity = inventoryManager.getItem(interaction.user.id, activeCharacter.id, ItemType.MATERIAL, ingredient.item);
                if (!itemQuantity || itemQuantity.quantity < ingredient.quantity) {
                    const item = itemManager.getItemDataById(ingredient.item);
                    missingIngredients.push(`${ingredient.quantity} x ${item.name}`);
                } else {
                    itemsToRemove.push({ itemId: ingredient.item, quantity: ingredient.quantity });
                }
            }
        }

        if (missingIngredients.length > 0) {
            return await sendErrorMessage(interaction, `You are missing the following ingredients: ${missingIngredients.join(', ')}`);
        }

        for (const toRemove of itemsToRemove) {
            const item = itemManager.getItemDataById(toRemove.itemId);
            inventoryManager.removeItem(interaction.user.id, activeCharacter.id, item, toRemove.quantity);
        }

        const result = recipe.result;
        let craftedItem;
        switch (result.type) {
            case ItemType.MATERIAL:
                craftedItem = new Item(itemManager.getItemDataById(Number(result.item)));
                break;
            case ItemType.EQUIPMENT:
                break;
            case ItemType.CONSUMABLE:
                craftedItem = new Consumable(itemManager.getConsumableDataById(Number(result.item)));
                break;
            default:
                return await sendErrorMessage(interaction, 'Unsupported item type for crafting.');
        }

        inventoryManager.addItem(interaction.user.id, activeCharacter.id, craftedItem, 1);

        activeCharacter.skills.increaseSkillXp('brewing', 30);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Crafting Successful!')
            .setDescription(`You have successfully crafted ${craftedItem.name} and it has been added to your inventory.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in brewCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const brewCommands = {
    brew: brewCommand
}
