import { EmbedBuilder } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { recipesParser } from '../util/util.js';

const recipeCommand = async (interaction) => {
    try {
        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        const recipeManager = RecipeManager.getInstance();

        //give player free recipe, this is only for test
        const testRecipe1 = recipeManager.getRecipeById(1);//kelp broth for cooking
        recipeManager.addCharRecipe(interaction.user.id, activeCharacter.id, testRecipe1);
        const testRecipe2 = recipeManager.getRecipeById(16);//potent health potion for brewing
        recipeManager.addCharRecipe(interaction.user.id, activeCharacter.id, testRecipe2);

        const charRecipes = recipeManager.getCharRecipes(interaction.user.id, activeCharacter.id);

        const charRecipeObjects = charRecipes.map(recipeId => recipeManager.getRecipeById(recipeId));

        let embed = new EmbedBuilder();
        embed = recipesParser(charRecipeObjects, embed);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in recipeCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const recipeCommands = {
    recipe: recipeCommand
};
