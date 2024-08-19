import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { RecipeManager } from '../manager/recipe_manager.js';
import { recipesParser } from '../util/util.js';
import { CharacterManager } from '../manager/character_manager.js';

export async function handleRecipeInteraction(interaction) {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const customId = interaction.customId;

    const recipeManager = RecipeManager.getInstance();
    const activeCharacter = CharacterManager.getInstance().getActiveCharacter(userId);
    const charRecipes = recipeManager.getCharRecipes(userId, activeCharacter.id);
    const charRecipeObjects = charRecipes.map(recipeId => recipeManager.getRecipeById(recipeId));

    let currentPage = parseInt(customId.split('_')[1]);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(charRecipeObjects.length / itemsPerPage);

    if (customId.startsWith('next')) {
        currentPage++;
        if (currentPage > totalPages) currentPage = 1;
    } else if (customId.startsWith('prev')) {
        currentPage--;
        if (currentPage < 1) currentPage = totalPages;
    }

    const paginatedRecipes = charRecipeObjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

    await interaction.update({ embeds: [embed], components: [components] });
}
