import { EmbedBuilder } from 'discord.js';
import { RegionManager } from "../manager/region_manager.js";
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { turnBasedCombat, sendCombatLog, sendAbilityButtons } from "../commands/command_attack.js";
import { AbilityDetails } from "../commands/command_attack.js";

export async function handleAttackInteraction(interaction) {
    if (!interaction.isButton()) return false;

    try {
        await interaction.deferReply({ ephemeral: true });

        const characterRepo = CharacterManager.getInstance();
        const activeChar = characterRepo.getActiveCharacter(interaction.user.id);

        if (!activeChar) {
            await interaction.followUp({ content: 'No active character found.', ephemeral: true });
            return;
        }

        const [action, abilityKey, ...enemyNameParts] = interaction.customId.split('_');
        const fullAction = `${action}_${abilityKey}`;
        const enemyName = enemyNameParts.join(' ');

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeChar.id);

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

        switch (fullAction) {
            case `attack_punch`:
            case `attack_drain`:
            case `attack_bite`:
            case `attack_slash`:
                const abilityIndex = Object.keys(AbilityDetails).find(key => AbilityDetails[key].name.toLowerCase().replace(/\s/g, '_') === abilityKey.toLowerCase());
                console.log(`abilityIndex: ${abilityIndex}`);
                const combatLog = turnBasedCombat(activeChar, enemy, parseInt(abilityIndex));
                await sendCombatLog(interaction, combatLog);

                if (activeChar.stats.hp > 0 && enemy.stats.hp > 0) {
                    await sendAbilityButtons(interaction, activeChar, enemy);
                } else {
                    const endEmbed = new EmbedBuilder()
                        .setTitle('Combat Ended')
                        .setDescription(activeChar.stats.hp <= 0 ? 'You were defeated!' : 'You defeated the enemy!')
                        .setColor(0xFF0000);
                    await interaction.followUp({ embeds: [endEmbed], ephemeral: true });
                }
                break;
            default:
                await interaction.followUp({ content: `Unknown interaction: ${interaction.customId}`, ephemeral: true });
                break;
        }
    } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.editReply({ content: 'An error occurred while processing your interaction.', ephemeral: true });
        }
    }
}