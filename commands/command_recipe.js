import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { recipesParser } from '../util/util.js';
import { sendErrorMessage } from "../util/util.js";

const skillButtons = [
    { label: "Smithing", customId: "skill_smithing", style: ButtonStyle.Primary },
    { label: "Brewing", customId: "skill_brewing", style: ButtonStyle.Primary },
    { label: "Cooking", customId: "skill_cooking", style: ButtonStyle.Primary },
    { label: "Gathering", customId: "skill_gathering", style: ButtonStyle.Primary }
];

const recipeCommand = async (interaction) => {
    try {
        const characterManager = CharacterManager.getInstance();
        const activeCharacter = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const recipeManager = RecipeManager.getInstance();

        // Grant player all recipes for testing
        for (let index = 1; index <= 95; index++) {
            const testRecipe = recipeManager.getRecipeById(index);
            recipeManager.addCharRecipe(interaction.user.id, activeCharacter.id, testRecipe);
        }

        const components = new ActionRowBuilder();
        skillButtons.forEach(button => {
            components.addComponents(
                new ButtonBuilder()
                    .setCustomId(button.customId)
                    .setLabel(button.label)
                    .setStyle(button.style)
            );
        });

        const embed = new EmbedBuilder()
            .setTitle("Recipe Categories")
            .setDescription("Select a category to view recipes.");

        await interaction.reply({ embeds: [embed], components: [components], ephemeral: true });
    } catch (error) {
        console.error("Error in recipeCommand:", error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
};

export const recipeCommands = {
    recipe: recipeCommand
};