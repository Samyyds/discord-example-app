import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { AbilityManager } from "../manager/ability_manager.js";

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

export function turnBasedCombat(player, enemy, abilityId) {
    const combatLog = [];
    const abilityManager = AbilityManager.getInstance();
    const ability = abilityManager.getAbilityById(abilityId);

    if (!ability) {
        combatLog.push('Invalid ability index.');
        return combatLog;
    }

    if (player.stats.mp < ability.mpCost) {
        combatLog.push(`${player.name} does not have enough MP to use ${ability.name}.`);
        return combatLog;
    }

    player.stats.mp -= ability.mpCost;

    console.log(`[Combat Log] ${player.name}'s MP after using ${ability.name}: ${player.stats.mp}`);

    let damage = 0;
    switch (ability.name.toLowerCase().replace(/\s/g, '_')) {
        case 'punch':
        case 'bite':
        case 'slash':
            damage = handlePhysicalAttack(player, enemy, ability.intensity);
            break;
        case 'drain':
            damage = handleMagicalAttack(player, enemy, ability.intensity);
            break;
        default:
            combatLog.push('Ability effect not implemented.');
            return combatLog;
    }

    combatLog.push(`${player.name} used ${ability.name} on ${enemy.name}.`);
    combatLog.push(`${enemy.name} took ${damage.toFixed(2)} damage. Remaining HP: ${enemy.stats.hp}`);

    if (enemy.stats.hp <= 0) {
        combatLog.push(`${enemy.name} is defeated!`);
        return combatLog;
    }

    const enemyAbilityId = 1; // Default enemy ability 
    const enemyAbility = abilityManager.getAbilityById(enemyAbilityId);
    const enemyDamage = handlePhysicalAttack(enemy, player, enemyAbility.intensity);

    combatLog.push(`${enemy.name} used ${enemyAbility.name} on ${player.name}.`);
    combatLog.push(`${player.name} took ${enemyDamage.toFixed(2)} damage. Remaining HP: ${player.stats.hp}`);

    if (player.stats.hp <= 0) {
        combatLog.push(`${player.name} is defeated!`);
    }

    return combatLog;
}


function handlePhysicalAttack(applicator, receiver, intensity) {
    const applicatorATK = applicator.stats.physicalATK;
    const receiverDEF = receiver.stats.physicalDEF;
    const damageReduction = 1 - (receiverDEF / 300);
    let damage = applicatorATK * damageReduction;
    damage *= (intensity / 100);
    receiver.stats.hp -= damage;
    return damage;
}

function handleMagicalAttack(applicator, receiver, intensity) {
    const applicatorMAG = applicator.stats.magicATK;
    const receiverMDEF = receiver.stats.magicDEF;
    const magDamageReduction = 1 - (receiverMDEF / 300);
    let damage = applicatorMAG * magDamageReduction;
    damage *= (intensity / 100);
    receiver.stats.hp -= damage;
    return damage;
}

export async function sendCombatLog(interaction, combatLog) {
    for (let i = 0; i < combatLog.length; i++) {
        const embed = new EmbedBuilder().setDescription(combatLog[i]).setColor(0xff0000);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1s
    }
}

export async function sendAbilityButtons(interaction, player, enemy) {
    const actionRow = new ActionRowBuilder();
    
    const abilityManager = AbilityManager.getInstance();
    
    player.abilities.forEach(abilityId => {
        const ability = abilityManager.getAbilityById(abilityId);
        const abilityButton = new ButtonBuilder()
            .setCustomId(`attack_${ability.name.toLowerCase().replace(/\s/g, '_')}_${enemy.name}`)
            .setLabel(ability.name)
            .setStyle(ButtonStyle.Primary);

        actionRow.addComponents(abilityButton);
    });

    const embed = new EmbedBuilder()
        .setTitle(`Combat with ${enemy.name}`)
        .setDescription('Select an ability to use in this turn.')
        .setColor(0x00FF00);

    await interaction.followUp({ embeds: [embed], components: [actionRow], ephemeral: true });
}


export const attackCommands = {
    attack: attackCommand
};
