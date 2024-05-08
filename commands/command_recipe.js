import { EmbedBuilder } from 'discord.js';
import { CharacterRepository } from '../data/repository_character.js';
import { RecipeRepository } from '../data/repository_recipe.js';
import { recipesParser } from '../util/util.js';

const recipeCommand = async (interaction) => {
    try {
        const characterRepo = CharacterRepository.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            throw new Error('You do not have an available character!');
        }

        const recipeRepo = RecipeRepository.getInstance();

        //give player free recipes, this is only for test
        recipeRepo.addRecipe(interaction.user.id, activeCharacter.id, 1);
        recipeRepo.addRecipe(interaction.user.id, activeCharacter.id, 2);

        const charRecipes = recipeRepo.getCharRecipes(interaction.user.id, activeCharacter.id);

        let embed = new EmbedBuilder();
        embed = recipesParser(charRecipes, embed);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in recipeCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const recipeCommands = {
    recipe: recipeCommand
};
