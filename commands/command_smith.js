import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { ItemType, Skill, Regions, MokuahLocations } from "../data/enums.js";
import { ItemManager, Equipment } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";
import { RegionManager } from "../manager/region_manager.js";
import { PlayerMovementManager } from "../manager/player_movement_manager.js";

const smithCommand = async (interaction) => {
    try {
        const recipeName = interaction.options.getString('recipe_name').trim();

        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeCharacter.id);
        
        if (regionId !== Regions.MOKUAH || locationId !== MokuahLocations.BLACKSMITH) {
            return await sendErrorMessage(interaction, 'Please head to the Moku\'ah Blacksmith to use the service.');
        }

        const recipeManager = RecipeManager.getInstance();
        const recipe = recipeManager.getRecipeByName(recipeName);

        if (recipe.skill != Skill.SMITHING) {
            return await sendErrorMessage(interaction, `It's not a smithing recipe!`);
        }

        if (!recipeManager.hasRecipe(interaction.user.id, activeCharacter.id, recipe.id)) {
            return await sendErrorMessage(interaction, 'You do not have this recipe!');
        }

        const ingredients = recipe.ingredients;
        const missingIngredients = [];
        const inventoryManager = InventoryManager.getInstance();
        const itemManager = ItemManager.getInstance();

        for (const ingredient of ingredients) {
            const itemQuantity = inventoryManager.getItem(interaction.user.id, activeCharacter.id, ItemType.MATERIAL, ingredient.item);
            if (!itemQuantity || itemQuantity.quantity < ingredient.quantity) {
                const item = itemManager.getItemDataById(ingredient.item);
                missingIngredients.push(`${ingredient.quantity} x ${item.name}`);
            }
        }

        if (missingIngredients.length > 0) {
            return await sendErrorMessage(interaction, `You are missing the following ingredients: ${missingIngredients.join(', ')}`);
        }

        ingredients.forEach(ingredient => {
            const item = itemManager.getItemDataById(ingredient.item);
            inventoryManager.removeItem(interaction.user.id, activeCharacter.id, item, ingredient.quantity);
        });

        const result = recipe.result;
        let craftedItem;
        switch (result.type) {
            case ItemType.MATERIAL:
                break;
            case ItemType.EQUIPMENT:
                craftedItem = new Equipment(itemManager.getEquipmentDataById(Number(result.item)));
                console.log(`craftedItem.rarity: ${craftedItem.rarity}`);
                break;
            case ItemType.CONSUMABLE:
                break;
            default:
                return await sendErrorMessage(interaction, 'Unsupported item type for crafting.');
        }

        inventoryManager.addItem(interaction.user.id, activeCharacter.id, craftedItem, 1);

        activeCharacter.skills.increaseSkillXp('smithing', 30);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Crafting Successful!')
            .setDescription(`You have successfully crafted ${craftedItem.name} and it has been added to your inventory.`);
        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in gatherCommand:', error);
        await sendErrorMessage(interaction, `An error occurred: ${error.message}`);
    }
}

export const smithCommands = {
    smith: smithCommand
};