import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
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

        // Grant player all recipes for testing
        for (let index = 1; index <= 28; index++) {
            const testRecipe = recipeManager.getRecipeById(index);
            recipeManager.addCharRecipe(interaction.user.id, activeCharacter.id, testRecipe);
        }
        //***

        const charRecipes = recipeManager.getCharRecipes(interaction.user.id, activeCharacter.id);
        const charRecipeObjects = charRecipes.map(recipeId => recipeManager.getRecipeById(recipeId));

        const currentPage = 1;
        const itemsPerPage = 10;
        const totalPages = Math.ceil(charRecipeObjects.length / itemsPerPage);
        const paginatedRecipes = charRecipeObjects.slice(0, itemsPerPage);

        let embed = new EmbedBuilder();
        embed = recipesParser(paginatedRecipes, embed);
        embed.setFooter({ text: `Page ${currentPage} of ${totalPages}` });

        const components = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${currentPage}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`next_${currentPage}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });

    } catch (error) {
        console.error('Error in recipeCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const recipeCommands = {
    recipe: recipeCommand
};
