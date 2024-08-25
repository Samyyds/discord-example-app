import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { InventoryManager } from '../manager/inventory_manager.js';
import { sendErrorMessage } from "../util/util.js";
import { ItemType, getItemTypeAndId, ConsumableEffect } from "../data/enums.js";

const useCommand = async (interaction) => {
    try {
        const consumableName = interaction.options.getString('consumable_name').trim();
        const itemInfo = getItemTypeAndId(consumableName);

        if (!itemInfo || itemInfo.type !== ItemType.CONSUMABLE) {
            return await sendErrorMessage(interaction, 'Can only use consumable items!');
        }

        const characterRepo = CharacterManager.getInstance();
        const activeCharacter = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeCharacter) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const inventoryManager = InventoryManager.getInstance();
        if (!inventoryManager.hasItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id)) {
            return await sendErrorMessage(interaction, 'You do not have this item in your inventory!');
        }

        const consumable = inventoryManager.getItem(interaction.user.id, activeCharacter.id, itemInfo.type, itemInfo.id);

        switch (consumable.effect) {
            case ConsumableEffect.PHY_ATK_BONUS:
            case ConsumableEffect.MAG_ATK_BONUS:
            case ConsumableEffect.PHY_DEF_BONUS:
            case ConsumableEffect.MAG_DEF_BONUS:
                activeCharacter.applyStatBonus(consumable.effect, consumable.effectValue);
                break;
            case ConsumableEffect.RESTORE_HP:
                activeCharacter.stats.hp = Math.min(activeCharacter.stats.hp + consumable.effectValue, activeCharacter.stats.hpMax);
                break;
            case ConsumableEffect.RESTORE_MP:
                activeCharacter.stats.mp = Math.min(activeCharacter.stats.mp + consumable.effectValue, activeCharacter.stats.mpMax);
                break;
            case ConsumableEffect.CURE_BLEED:
            case ConsumableEffect.CURE_POISON:
            case ConsumableEffect.CURE_BURN:
                activeCharacter.status.removeStatusEffect(consumable.effect);
                break;
        }
        inventoryManager.removeItem(interaction.user.id, activeCharacter.id, consumable, 1);

        const embed = new EmbedBuilder()
            .setColor(0x00AE86)
            .setTitle('Used Consumable')
            .setDescription(`You have successfully used ${consumable.name}.\nEffect: ${consumable.description}`);

        await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
        console.error('Error in useCommand:', error);
        await interaction.reply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export const useCommands = {
    use: useCommand
};