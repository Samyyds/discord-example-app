import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { Ability } from "../data/enums.js";

const AbilityDetails = {
    0: { name: 'Smash', intensity: 150, mpCost: 0 }
};

const attackCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });
        
        const characterRepo = CharacterManager.getInstance();
        const activeChar = characterRepo.getActiveCharacter(interaction.user.id);
        if (!activeChar) {
            throw new Error('You do not have an available character!');
        }

        const enemyNameInput = interaction.options.getString('enemy-name');
        if (!enemyNameInput) {
            throw new Error('Enemy name is required.');
        }
        const enemyName = enemyNameInput.trim().toLowerCase();

        const playerMoveManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMoveManager.getLocation(interaction.user.id, activeChar.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            throw new Error(`Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }
        const enemies = room.getEnemies();

        const enemy = enemies.find(enemy => enemy.name.toLowerCase() === enemyName);
        if (!enemy) {
            throw new Error(`Enemy with name ${enemyName} not found in this room.`);
        }

        await interaction.editReply({ content: `Combat started with ${enemy.name}!` });
        await sendAbilityButtons(interaction, activeChar, enemy);
    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export function turnBasedCombat(player, enemy, abilityIndex) {
    const combatLog = [];
    const ability = AbilityDetails[abilityIndex];

    if (!ability) {
        combatLog.push('Invalid ability index.');
        return combatLog;
    }

    if (player.stats.mp < ability.mpCost) {
        combatLog.push(`${player.name} does not have enough MP to use ${ability.name}.`);
        return combatLog;
    }

    player.stats.mp -= ability.mpCost;

    const applicatorATK = player.stats.physicalATK;
    const receiverDEF = enemy.stats.physicalDEF;
    const damageReduction = 1 - (receiverDEF / 300);
    let damage = applicatorATK * damageReduction;
    damage *= (ability.intensity / 100);
    enemy.stats.hp -= damage;

    combatLog.push(`${player.name} used ${ability.name} on ${enemy.name}.`);
    combatLog.push(`${enemy.name} took ${damage.toFixed(2)} damage.`);

    if (enemy.stats.hp <= 0) {
        combatLog.push(`${enemy.name} is defeated!`);
        return combatLog;
    }

    const enemyAbilityIndex = Ability.SMASH;
    const enemyAbility = AbilityDetails[enemyAbilityIndex];
    const enemyATK = enemy.stats.physicalATK;
    const playerDEF = player.stats.physicalDEF;
    const enemyDamageReduction = 1 - (playerDEF / 300);
    let enemyDamage = enemyATK * enemyDamageReduction;
    enemyDamage *= (enemyAbility.intensity / 100);
    player.stats.hp -= enemyDamage;

    combatLog.push(`${enemy.name} used ${enemyAbility.name} on ${player.name}.`);
    combatLog.push(`${player.name} took ${enemyDamage.toFixed(2)} damage.`);

    if (player.stats.hp <= 0) {
        combatLog.push(`${player.name} is defeated!`);
    }

    return combatLog;
}

export async function sendCombatLog(interaction, combatLog) {
    for (let i = 0; i < combatLog.length; i++) {
        const embed = new EmbedBuilder().setDescription(combatLog[i]).setColor(0xff0000);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s
    }
}

export async function sendAbilityButtons(interaction, player, enemy) {
    const smashButton = new ButtonBuilder()
        .setCustomId(`attack_smash_${enemy.name}`)
        .setLabel('Smash')
        .setStyle(ButtonStyle.Primary);

    const actionRow = new ActionRowBuilder().addComponents(smashButton);

    const embed = new EmbedBuilder()
        .setTitle(`Combat with ${enemy.name}`)
        .setDescription('Select an ability to use in this turn.')
        .setColor(0x00FF00);

    await interaction.followUp({ embeds: [embed], components: [actionRow], ephemeral: true });
}

export const attackCommands = {
    attack: attackCommand
};
