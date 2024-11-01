import { EmbedBuilder } from 'discord.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { AbilityManager } from '../manager/ability_manager.js';
import { turnBasedCombat, sendCombatLog, sendAbilityButtons } from "../commands/command_attack.js";

export async function handleAttackInteraction(interaction) {
    if (!interaction.isButton()) return false;

    try {
        await interaction.deferReply({ ephemeral: true });

        const characterManager = CharacterManager.getInstance();
        const activeChar = characterManager.getActiveCharacter(interaction.user.id);

        if (!activeChar) {
            await interaction.followUp({ content: 'No active character found.', ephemeral: true });
            return;
        }

        const parts = interaction.customId.split('_');
        const action = parts[0];
        const abilityKey = parts.slice(1, parts.length - 1).join(' '); 
        const enemyName = parts[parts.length - 1]; 

        const playerMovementManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMovementManager.getLocation(interaction.user.id, activeChar.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            await interaction.followUp({ content: `Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`, ephemeral: true });
            return;
        }
        const enemies = room.getEnemies();

        const enemy = enemies.find(enemy => enemy.name.toLowerCase() === enemyName.toLowerCase());

        if (!enemy) {
            await interaction.followUp({ content: `Enemy with name ${enemyName} not found in this room.`, ephemeral: true });
            return;
        }

        const abilityManager = AbilityManager.getInstance();
        const ability = abilityManager.getAbilityByName(abilityKey.replace('_', ' '));
        switch (action) {
            case 'attack':
                const { combatLog, playerAlive, enemyAlive } = turnBasedCombat(interaction, activeChar, enemy, ability.id, regionManager, regionId, locationId, roomId);
                await sendCombatLog(interaction, combatLog);

                if (playerAlive && enemyAlive) {
                    await sendAbilityButtons(interaction, activeChar, enemy);
                } else {
                    const endEmbed = new EmbedBuilder()
                       .setTitle('Combat Ended')
                       .setDescription(playerAlive
                           ? 'You defeated the enemy!'
                            : 'You died!')
                       .setColor(playerAlive? 0x00FF00 : 0xFF0000);
                    await interaction.followUp({ embeds: [endEmbed], ephemeral: true });
                }
                break;
            default:
                await interaction.followUp({ content: `Unknown interaction: ${interaction.customId}`, ephemeral: true });
                break;
        }
    } catch (error) {
        console.error(error);
        if (!interaction.replied &&!interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred while processing your interaction.', ephemeral: true });
        }
    }
}
