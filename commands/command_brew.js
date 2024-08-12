import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { ItemType } from "../data/enums.js";
import { Consumable, Item, ItemManager } from "../manager/item_manager.js";

const brewCommand = async (interaction) => {
    try {
        const recipeName = interaction.options.getString('recipe_name').trim();

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        const recipeManager = RecipeManager.getInstance();
        const recipe = recipeManager.getRecipeByName(recipeName);

        if (!recipeManager.hasRecipe(recipe.id)) {
            throw new Error('You do not have this recipe!');
        }

        const ingredients = recipe.ingredients;
        const missingIngredients = [];
        const inventoryManager = InventoryManager.getInstance();
        const itemManager = ItemManager.getInstance();

        for (const ingredient of ingredients) {
            if (ingredient.item === "any_consumable") {
                let foundConsumable = false;
                const consumables = itemManager.consumableTemplates.map(c => c.id);
                for (const id of consumables) {
                    const itemQuantity = inventoryManager.getItem(interaction.user.id, activeCharacter.id, id);
                    if (itemQuantity && itemQuantity.quantity >= ingredient.quantity) {
                        inventoryManager.removeItems(interaction.user.id, activeCharacter.id, id, ingredient.quantity);
                        foundConsumable = true;
                        break;
                    }
                }
                if (!foundConsumable) {
                    missingIngredients.push(`${ingredient.quantity} x any consumable`);
                }
            } else {
                const itemQuantity = inventoryManager.getItem(interaction.user.id, activeCharacter.id, ingredient.item);
                if (!itemQuantity || itemQuantity.quantity < ingredient.quantity) {
                    const item = itemManager.getItemDataById(ingredient.item);
                    missingIngredients.push(`${ingredient.quantity} x ${item.name}`);
                }
                else {
                    inventoryManager.removeItems(interaction.user.id, activeCharacter.id, ingredient.item, ingredient.quantity);
                }
            }
        }

        if (missingIngredients.length > 0) {
            throw new Error(`You are missing the following ingredients: ${missingIngredients.join(', ')}`);
        }

        ingredients.forEach(ingredient => {
            inventoryManager.removeItems(interaction.user.id, activeCharacter.id, ingredient.item, ingredient.quantity);
        });

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
                throw new Error('Unsupported item type for crafting.');
        }

        inventoryManager.addItem(interaction.user.id, activeCharacter.id, craftedItem, 1);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Crafting Successful!')
            .setDescription(`You have successfully crafted ${craftedItem.name} and it has been added to your inventory.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in gatherCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const brewCommands = {
    brew: brewCommand
}