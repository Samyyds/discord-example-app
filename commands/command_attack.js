import { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from 'discord.js';
import { CharacterManager } from '../manager/character_manager.js';
import { PlayerMovementManager } from "../manager/player_movement_manager.js";
import { RegionManager } from "../manager/region_manager.js";
import { AbilityManager } from "../manager/ability_manager.js";
import { ItemManager } from "../manager/item_manager.js";
import { sendErrorMessage } from "../util/util.js";

const attackCommand = async (interaction) => {
    try {
        await interaction.deferReply({ ephemeral: true });

        const characterManager = CharacterManager.getInstance();
        const activeChar = characterManager.getActiveCharacter(interaction.user.id);
        if (!activeChar) {
            return await sendErrorMessage(interaction, 'You do not have an available character!');
        }

        const enemyNameInput = interaction.options.getString('enemy-name');
        if (!enemyNameInput) {
            return await sendErrorMessage(interaction, 'Enemy name is required.');
        }
        const enemyName = enemyNameInput.trim().toLowerCase();

        const playerMovementManager = PlayerMovementManager.getInstance();
        const { regionId, locationId, roomId } = playerMovementManager.getLocation(interaction.user.id, activeChar.id);

        const regionManager = RegionManager.getInstance();
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (!room) {
            return await sendErrorMessage(interaction, `Room not found for regionId ${regionId}, locationId ${locationId}, roomId ${roomId}`);
        }
        const enemies = room.getEnemies();

        const enemy = enemies.find(enemy => enemy.name.toLowerCase() === enemyName);
        if (!enemy) {
            return await sendErrorMessage(interaction, `Enemy with name ${enemyName} not found in this room.`);
        }

        await interaction.editReply({ content: `Combat started with ${enemy.name}!` });
        await sendAbilityButtons(interaction, activeChar, enemy);
    } catch (error) {
        console.error('Error in attackCommand:', error);
        await interaction.editReply({ content: `An error occurred: ${error.message}`, ephemeral: true });
    }
}

export function turnBasedCombat(interaction, player, enemy, abilityId, regionManager, regionId, locationId, roomId) {
    const combatLog = [];

    const abilityManager = AbilityManager.getInstance();
    const ability = abilityManager.getAbilityById(abilityId);

    if (!ability) {
        combatLog.push('Invalid ability index.');
        return { combatLog, playerAlive: true, enemyAlive: true };
    }

    if (player.stats.mp < ability.mpCost) {
        combatLog.push(`${player.name} does not have enough MP to use ${ability.name}.`);
        return { combatLog, playerAlive: true, enemyAlive: true };
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
            return { combatLog, playerAlive: true, enemyAlive: true };
    }

    combatLog.push(`${player.name} used ${ability.name} on ${enemy.name}.`);
    combatLog.push(`${enemy.name} took ${damage} damage. Remaining HP: ${enemy.stats.hp}`);

    if (enemy.stats.hp <= 0) {
        combatLog.push(`${enemy.name} is defeated!`);
        const room = regionManager.getRoomByLocation(regionId, locationId, roomId);
        if (enemy.dropItem && Math.random() < enemy.dropChance) {
            const itemManager = ItemManager.getInstance();
            const droppedItem = itemManager.getItemDataById(enemy.dropItem);
            room.addItemToRoom(droppedItem);
            combatLog.push(`${enemy.name} dropped ${droppedItem.name}!`);
        }

        room.removeEnemy(enemy);
        return { combatLog, playerAlive: true, enemyAlive: false };
    }

    let enemyAbility;
    if (enemy.abilities.length === 1) {
        enemyAbility = abilityManager.getAbilityById(enemy.abilities[0]);
    } else if (enemy.abilities.length > 1) {
        const randomAbilityIndex = Math.floor(Math.random() * enemy.abilities.length);
        enemyAbility = abilityManager.getAbilityById(enemy.abilities[randomAbilityIndex]);
    }

    if (!enemyAbility) {
        combatLog.push('Enemy tried to use an invalid ability.');
        return { combatLog, playerAlive: true, enemyAlive: true };
    }

    const enemyDamage = handlePhysicalAttack(enemy, player, enemyAbility.intensity);

    combatLog.push(`${enemy.name} used ${enemyAbility.name} on ${player.name}.`);
    combatLog.push(`${player.name} took ${enemyDamage} damage. Remaining HP: ${player.stats.hp}`);

    if (player.stats.hp <= 0) {
        combatLog.push(`${player.name} is defeated!`);
        combatLog.push('Your soul will be sent to the Moku\'ah Clinic.');
        const characterManager = CharacterManager.getInstance();
        characterManager.reviveCharacter(interaction.user.id);
        return { combatLog, playerAlive: false, enemyAlive: true };
    }

    return { combatLog, playerAlive: true, enemyAlive: true };
}

function handlePhysicalAttack(applicator, receiver, intensity) {
    const applicatorATK = applicator.stats.physicalATK;
    const receiverDEF = receiver.stats.physicalDEF;
    const damageReduction = 1 - (receiverDEF / 300);
    let damage = applicatorATK * damageReduction;
    damage *= (intensity / 100);
    damage = Math.round(damage);
    receiver.stats.applyDamage(damage);
    return damage;
}

function handleMagicalAttack(applicator, receiver, intensity) {
    const applicatorMAG = applicator.stats.magicATK;
    const receiverMDEF = receiver.stats.magicDEF;
    const magDamageReduction = 1 - (receiverMDEF / 300);
    let damage = applicatorMAG * magDamageReduction;
    damage *= (intensity / 100);
    damage = Math.round(damage);
    receiver.stats.applyDamage(damage);
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
