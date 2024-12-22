import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { recipesParser } from '../util/util.js';
import { CharacterManager } from '../manager/character_manager.js';
import { Skill } from "../data/enums.js";

export async function handleRecipeInteraction(interaction) {
    if (!interaction.isButton()) return;

    const recipeManager = RecipeManager.getInstance();
    const customId = interaction.customId;

    const skillMapping = {
        skill_smithing: Skill.SMITHING,
        skill_brewing: Skill.BREWING,
        skill_cooking: Skill.COOKING,
        skill_gathering: Skill.GATHERING
    };

    if (customId.startsWith('next') || customId.startsWith('prev')) {
        const [action, currentPage, skill] = customId.split('_');
        const skillId = parseInt(skill);

        if (isNaN(skillId)) {
            await interaction.reply({ content: "Invalid skill category for pagination!", ephemeral: true });
            return;
        }

        const recipes = recipeManager.getAllRecipes().filter(recipe => recipe.skill === skillId);
        const itemsPerPage = 10;
        const totalPages = Math.ceil(recipes.length / itemsPerPage);
        let newPage = parseInt(currentPage);

        if (action === 'next') {
            newPage++;
            if (newPage > totalPages) newPage = 1;
        } else if (action === 'prev') {
            newPage--;
            if (newPage < 1) newPage = totalPages;
        }

        const paginatedRecipes = recipes.slice((newPage - 1) * itemsPerPage, newPage * itemsPerPage);

        let embed = new EmbedBuilder();
        embed.setTitle("Recipes")
            .setDescription("Here are the recipes in this category:")
            .setFooter({ text: `Page ${newPage} of ${totalPages}` });

        embed = recipesParser(paginatedRecipes, embed);

        const components = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_${newPage}_${skillId}`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`next_${newPage}_${skillId}`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
            );

        await interaction.update({ embeds: [embed], components: [components] });
        return;
    }

    const skill = skillMapping[customId];

    if (skill === undefined) {
        await interaction.reply({ content: "Invalid skill category!", ephemeral: true });
        return;
    }

    const recipes = recipeManager.getAllRecipes().filter(recipe => recipe.skill === skill);

    if (recipes.length === 0) {
        await interaction.reply({ content: "No recipes found for this category!", ephemeral: true });
        return;
    }

    const paginatedRecipes = recipes.slice(0, 10); 
    const totalPages = Math.ceil(recipes.length / 10);
    const currentPage = 1;

    let embed = new EmbedBuilder();
    embed.setTitle("Recipes")
        .setDescription("Here are the recipes in this category:")
        .setFooter({ text: `Page ${currentPage} of ${totalPages}` });

    embed = recipesParser(paginatedRecipes, embed);

    const components = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`prev_${currentPage}_${skill}`)
                .setLabel('Previous')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`next_${currentPage}_${skill}`)
                .setLabel('Next')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.update({ embeds: [embed], components: [components] });
}
